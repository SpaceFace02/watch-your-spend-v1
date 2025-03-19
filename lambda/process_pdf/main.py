import json
import boto3
import os
from collections import defaultdict
from trp import Document
from textractcaller import get_full_json
import traceback
from enum import Enum
from helpers import get_kv_relationship, get_mappings, update_statement, get_connection_id, delete_connection, generate_complete_json_stream
import uuid
from datetime import datetime

from botocore.config import Config

class Textract_API(Enum):
    ANALYZE = 1
    DETECT = 2
    EXPENSE = 3
    LENDING = 4

textract = boto3.client("textract")
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")
config = Config(read_timeout=1000)
bedrock_client = boto3.client(service_name='bedrock-runtime', config=config)
DYNAMODB_TABLE_NAME = os.environ["AWS_DYNAMODB_TABLE_NAME"]
apigateway_management_api = boto3.client('apigatewaymanagementapi', endpoint_url=f'{os.environ["API_GATEWAY_ENDPOINT"]}')

def lambda_handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])
    file_name = message["DocumentLocation"]["S3ObjectName"]
    job_id = message["JobId"]
    status = message["Status"]
    user_id = message.get('JobTag')

    if status != "SUCCEEDED":
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Job {job_id} failed."})
        }

    try:
        # Fetch the Textract results using textractcaller package available to us via Lambda layer.
        response = get_full_json(
                        job_id,
                        textract_api=Textract_API.ANALYZE,
                        boto3_textract_client=textract,
                    )

        doc = Document(response)
        blocks = response.get("Blocks", [])

        lines = ""
        table_str = ""

        # Extract lines and tables first as a foundation.
        for page in doc.pages:
            # Print lines and words
            for line in page.lines:
                lineStr = "Line: {}\n".format(line.text)
                lines += lineStr

            table_str += "\n" + "Transaction Table Details" + "\n"
            for table in page.tables:
                for row in table.rows:
                    charCount = 0
                    for cell in row.cells:
                        table_str += cell.text + " | "
                        charCount += len(cell.text)
                    table_str += "\n"
                    table_str += "-" * 3 + "\n"


        # Extract key value pairs then.
        key_map, value_map, block_map = get_mappings(blocks)
        kvs = get_kv_relationship(key_map, value_map, block_map)

        kv_str = ""
        for key, value in kvs.items():
            kv_str += f"{key}: {value}\n"
            
        # Format string for LLM
        llm_query = f"This is the bank statement table data extracted:\n\n{table_str}"

        messages = []
        # AWS Bedrock.
        system_prompts = [{"text": "You are an app that gets processes bank statements. Bank statements (PDF) are processed by an OCR, and you receive text, in the form of tables and key-value pairs. Your job is to analyze this data, and return data that is asked to you. ONLY return a JSON object for the task given to you. It should be a serializable JSON object which I can store in Dynamo DB. JUST the JSON object. Do not even say something like 'Here is your response'. I WANT JUST THE RESPONSE, so I can parse your response using JSON. Ensure that the output strictly follows JSON syntax and structure without any extra text. MAKE SURE TO RETURN 30 transactions(if available), that is, the number of objects in your returned JSON should be 30, not 10 objects with random serial numbers from 1 to 30. THIS IS VERY IMPORTANT AND TOP PRIORITY! ALSO SPREAD OUT THE JSON OBJECTS OVER MULTIPLE MONTHS. I DON'T WANT ALL TRANSACTIONS OF A SINGLE MONTH! Also make sure to have just these 7 categories of a transaction: Food, Entertainment, Bills, Misc, Shopping, Travel and Events. Please do not introduce any new category, if you are unsure about purchase, or it seems out of the aforementioned categories, MARK it as Misc."}]

        message_1 = {
        "role": "user",
        "content": [{"text": "I want you to analyze these kv pairs and tables. Return JUST a parsable JSON object, having all these transactions in the table. Each transaction should be attempted to categorize based on the following categories: Food, Entertainment, Bills, Misc, Shopping, Events etc. Each transaction should be grouped well, with its appropriate columns and values. Try to understand what the transaction remarks/name means, and give a new field called Interpretated Transaction Name. After you interpret the transaction name, remove the original one from the JSON object. Also, remove any unnecessary key value pair, the only ones needed are Name, duration of statement and account number."}, 
        {"text": "In each transaction object, just have the following fields: Deposit/Withdrawal, Amount, Transaction Category, Date/Time Transacted, Sr. No, transaction remarks, interpreted transaction name. Also, please name the key value pairs EXACTLY as mentioned here: name, duration, account_number. And for each transaction, name the fields EXACTLY as follows: deposit-withdrawal, amount, transaction_category, date_time, sr_no, remarks, interpreted_transaction_name. Also there is no need of any extra backslash n or extra characters. RETURN JUST A JSON Object, your response should be parsable by JSON.loads."}, {"text": llm_query}]
        }
        
        messages.append(message_1)

        data, output_message = generate_complete_json_stream(bedrock_client, messages, system_prompts)

        if not data:
            print("JSON parsing failed. Returning...")
            return {'statusCode': 400, 'body': 'Please upload a PDF with less transactions, or please try using a different PDF!'}

        updated_statement = update_statement(dynamodb, user_id, file_name, output_message, os.environ["AWS_DYNAMODB_TABLE_NAME"])

        # Getting connection id of that user_id
        connection_id = get_connection_id(dynamodb, user_id, os.environ["AWS_DYNAMODB_CONNECTION_IDS"])
        if not connection_id:
            print("No connection ID found")
            return {'statusCode': 400, 'body': 'Connection ID not found'}

        # Send the message
        try:
            apigateway_management_api.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(updated_statement)
            )
            print("Message to websocket sent.")
            return {'statusCode': 200, 'body': 'Message sent'}
        except apigateway_management_api.exceptions.GoneException:
            # Connection is gone, remove from DB
            print("Lost connection")
            delete_connection(dynamodb, connection_id, os.environ["AWS_DYNAMODB_CONNECTION_IDS"])
            return {'statusCode': 400, 'body': 'Connection is gone'}

    except Exception as e:
        error_message = traceback.format_exc()
        print("Error:", error_message)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(error_message)})
        }

    finally:
        # Delete the file from the S3 bucket, once dynamodb stuff is done.
        try:
            s3.delete_object(Bucket=os.environ["BUCKET_NAME"], Key=file_name)
            print("Deleted successfully")
        except Exception as e:
            print("Error deleting file from S3:", e)

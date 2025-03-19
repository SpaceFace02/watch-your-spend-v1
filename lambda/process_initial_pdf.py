import json
import boto3
import base64
import os

def lambda_handler(event, context):
    textract = boto3.client("textract")
    s3 = boto3.client("s3")


    if event.get("isBase64Encoded"):
        # Decode the Base64 body
        decoded_body = base64.b64decode(event["body"]).decode("utf-8")
    else:
        # Use the body as is
        decoded_body = event["body"]

    parsed_body = json.loads(decoded_body)

    # Extracting file name from event, and also extracting the user id.
    file_name = parsed_body.get("file_name", None)
    user_id = parsed_body.get("user_id", None)
    
    try:
        if not file_name or not user_id:
            raise ValueError("File name or user ID is missing.")

        # Fetching the file from S3
        response = s3.get_object(Bucket=os.environ['BUCKET_NAME'], Key=file_name)

        # Async operation.
        response = textract.start_document_analysis(
            DocumentLocation={"S3Object": {
                "Bucket": os.environ['BUCKET_NAME'],
                "Name": file_name
            }},
            FeatureTypes=["TABLES", "FORMS"],
            NotificationChannel={
                "SNSTopicArn": os.environ['SNS_TOPIC_ARN'],
                "RoleArn": os.environ['SNS_ROLE_ARN']
            },
            JobTag=user_id
        )

        job_id = response["JobId"]

        return {
        'statusCode': 200,
        'body': json.dumps({"job_id": job_id})
        }   
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
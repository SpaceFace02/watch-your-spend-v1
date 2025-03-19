from collections import defaultdict
from bedrock_helpers import generate_conversation_stream
import json
from botocore.exceptions import NoCredentialsError
import os

def find_value_block(key_block, value_map):
    for relationship in key_block['Relationships']:
        if relationship['Type'] == 'VALUE':
            for value_id in relationship['Ids']:
                value_block = value_map[value_id]
    return value_block

def get_text(result, blocks_map):
    text = ''
    if 'Relationships' in result:
        for relationship in result['Relationships']:
            if relationship['Type'] == 'CHILD':
                for child_id in relationship['Ids']:
                    word = blocks_map[child_id]
                    if word['BlockType'] == 'WORD':
                        text += word['Text'] + ' '
                    if word['BlockType'] == 'SELECTION_ELEMENT':
                        if word['SelectionStatus'] == 'SELECTED':
                            text += 'X'

    return text

def get_kv_relationship(key_map, value_map, block_map):
    kvs = defaultdict(list)
    for block_id, key_block in key_map.items():
        value_block = find_value_block(key_block, value_map)
        key = get_text(key_block, block_map)
        val = get_text(value_block, block_map)
        kvs[key].append(val)
    return kvs

def get_mappings(blocks):
    # get key and value maps
    key_map = {}
    value_map = {}
    block_map = {}
    for block in blocks:
        block_id = block['Id']
        block_map[block_id] = block
        if block['BlockType'] == "KEY_VALUE_SET":
            if 'KEY' in block['EntityTypes']:
                key_map[block_id] = block
            else:
                value_map[block_id] = block

    return key_map, value_map, block_map

def update_statement(dynamodb, user_id, file_name, data, table_name):
    table = dynamodb.Table(table_name)

    try:
        # Get the current item
        response = table.get_item(Key={"user_id": user_id})
        item = response.get("Item")
        if not item or "statements" not in item:
            print("No statements found for the user.")
            return

        # Find the index of the statement to update
        statements = item["statements"]
        for i, statement in enumerate(statements):
            if statement["file_name"] == file_name:
                # Update the statement in-place
                statement["status"] = "done"
                statement["data"] = data
                break
        else:
            print("Statement not found.")
            return

        # Update the entire statements list back to DynamoDB
        table.update_item(
            Key={"user_id": user_id},
            UpdateExpression="SET statements = :updated_statements",
            ExpressionAttributeValues={":updated_statements": statements},
        )
        print(f"Statement {file_name} updated successfully.")
        return statement
    except NoCredentialsError:
        print("AWS credentials not found.")
    except Exception as e:
        print(f"Error: {e}")

def get_connection_id(dynamodb, user_id, table_name):
    table = dynamodb.Table(table_name)

    # Scan command to get all items, and find the connection_id for the corresponding user_id
    try:
        response = table.scan()
        items = response.get("Items", [])
        for item in items:
            if item.get("user_id") == user_id:
                connection_id = item.get("connection_id")
                return connection_id
        return None
    except NoCredentialsError:
        print("AWS credentials not found.")

    except Exception as e:
        print(f"Error: {e}")

def delete_connection(dynamodb, connection_id, table_name):
    table = dynamodb.Table(table_name)
    try:
        table.delete_item(Key={"connection_id": connection_id})
        print(f"Connection {connection_id} deleted successfully.")
    except NoCredentialsError:
        print("AWS credentials not found.")
    except Exception as e:
        print(f"Error: {e}")

def generate_complete_json_stream(bedrock_client, messages, system_prompts):
    output_message = ""
    max_retries = 2

    while max_retries > 0:
        try:
            for chunk in generate_conversation_stream(
                bedrock_client, os.environ["AWS_MODEL_ID"], system_prompts, messages
            ):
                if chunk.strip():
                    output_message += chunk
                    print(chunk, end="", flush=True)  # Live streaming output

            data = json.loads(output_message)
            return data, output_message
        except json.JSONDecodeError:
            print("JSON parsing failed. Asking LLM to continue...")
            message_2 = {
                "role": "assistant",
                "content": [{"text": output_message}]
            }
            messages.append(message_2)

            messages.append({
                "role": "user",
                "content": [{"text": (
                    "Continue from the exact point you left off in our previous response. "
                    "Ensure that when concatenated with the previous response, the JSON is valid and if we call JSON.loads(new_response + old_response), it succeeds."
                    "Provide ONLY the continued JSON—no extra words."
                )}]
            })
            max_retries -= 1
    return None, output_message
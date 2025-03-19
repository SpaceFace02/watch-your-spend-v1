import json
from boto3.dynamodb.conditions import Attr
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ["AWS_DYNAMODB_CONNECTION_IDS"])

def lambda_handler(event, context):
    route_key = event['requestContext']['routeKey']
    connection_id = event['requestContext']['connectionId']
    user_id = event.get('queryStringParameters', {}).get('user_id')

    try:
        if route_key == "$connect":
            # We don't want duplicate connection ids for one user, so we only set a new item, if a user doesn't have a connection id already. 
            # Even though the front-end cleans up the connection id, when the component dismounts, this is still a good practice.
            if user_id:
                try:
                    response = table.scan(
                    FilterExpression=Attr('user_id').eq(user_id)
                        )
                    if response['Count'] > 0:
                        # Delete the connection id, to create a fresh websocket connection, instead of the stale one from before.
                        table.delete_item(Key={'connection_id': response['Items'][0]['connection_id']})
                    table.put_item(Item={'connection_id': connection_id, 'user_id': user_id})
                except Exception as e:
                    print(f"Error: {e}")
                finally:
                    return {'statusCode': 200}
            else:
                return {'statusCode': 400, 'body': 'Missing parameters'}

        elif route_key == "$disconnect":
            # Remove the connection ID
            table.delete_item(Key={'connection_id': connection_id})
            return {'statusCode': 200}

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': 'Internal Server Error'}

    return {'statusCode': 400, 'body': 'Invalid route'}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import 'dotenv/config'

const dynamodb = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const docClient = DynamoDBDocumentClient.from(dynamodb)

export async function POST(req) {
  try {
    const { tableName, userId, newStatement } = await req.json()

    if (!tableName || !userId || !newStatement) {
      return new Response(
        JSON.stringify({ error: 'Missing tableName, userId, or newStatement' }),
        { status: 400 }
      )
    }

    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        user_id: userId,
      },
      UpdateExpression:
        'SET #statements = list_append(if_not_exists(#statements, :empty_list), :new_statement)',
      ExpressionAttributeNames: {
        '#statements': 'statements',
      },
      ExpressionAttributeValues: {
        ':new_statement': [newStatement],
        ':empty_list': [],
      },
    })

    await docClient.send(command)

    return new Response(
      JSON.stringify({ message: 'Item updated successfully.' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('DynamoDB Update Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

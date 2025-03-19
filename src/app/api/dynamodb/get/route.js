import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
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
  const { tableName, userId } = await req.json()

  if (!tableName || !userId) {
    return new Response(
      JSON.stringify({ error: 'Missing tableName or userId' }),
      { status: 400 }
    )
  }

  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: {
        user_id: userId,
      },
    })
    const response = await docClient.send(command)

    if (!response.Item) return new Response(JSON.stringify([]), { status: 200 })

    return new Response(JSON.stringify(response.Item.statements || []), {
      status: 200,
    })
  } catch (error) {
    console.error('DynamoDB Get Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

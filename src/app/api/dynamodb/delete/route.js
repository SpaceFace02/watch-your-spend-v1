import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { NextResponse } from 'next/server'

const dynamodb = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})
const docClient = DynamoDBDocumentClient.from(dynamodb)

export async function DELETE(request) {
  try {
    const { user_id, file_name } = await request.json()
    const tableName = process.env.NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME

    // First get the current statements
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: { user_id },
    })

    const response = await docClient.send(getCommand)
    if (!response.Item) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Filter out the statement to delete
    const updatedStatements = response.Item.statements.filter(
      (statement) => statement.file_name !== file_name
    )

    // Update the DynamoDB record
    const updateCommand = new UpdateCommand({
      TableName: tableName,
      Key: { user_id },
      UpdateExpression: 'SET statements = :statements',
      ExpressionAttributeValues: {
        ':statements': updatedStatements,
      },
    })

    await docClient.send(updateCommand)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting statement:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import styles from './page.module.css'
import Sidebar from '@/app/Sidebar'
import 'dotenv/config'
import DisplayCharts from '@/components/charts/DisplayCharts'
import Delete from '@/components/custom/Delete'

const dynamodb = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})
const docClient = DynamoDBDocumentClient.from(dynamodb)

export default async function Page({ params }) {
  const awaitedParams = await params
  const fileName = awaitedParams.file
  const user = awaitedParams.user

  const tableName = process.env.NEXT_PUBLIC_AWS_DYNAMODB_TABLE_NAME

  if (!tableName || !user || !fileName) {
    return <div>Invalid user, or fileName</div>
  }

  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: {
        user_id: user,
      },
    })
    // Find the filename in the user's statements
    const response = await docClient.send(command)
    if (!response.Item) {
      return <div>No statements found under the user</div>
    }

    const statements = response.Item.statements || []
    const statement = statements.find(
      (statement) => statement.file_name === fileName
    )

    if (!statement) {
      return <div>Statement not found</div>
    }

    return (
      <div className={styles.pageContainer}>
        <Sidebar
          statements={statements}
          user={user}
          loading={false} // It is rendered server side, so fully rendered page is only sent to the client.
        />
        <div className={styles.content}>
          <div className={styles.uploadSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{statement.file_name}</h3>
                <p>
                  <strong>Uploaded at:</strong>{' '}
                  {new Date(statement.uploaded_on).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`${styles.status} ${
                      statement.status === 'processing'
                        ? styles.processing
                        : styles.completed
                    }`}
                  >
                    {statement.status === 'processing'
                      ? 'Processing...'
                      : 'Completed'}
                  </span>
                </p>
              </div>
              <div>
                <Delete
                  user={user}
                  fileName={fileName}
                  disabled={statement.status === 'processing'}
                />
              </div>
            </div>

            <DisplayCharts statement={JSON.parse(statement.data)} />
            {/* <pre>{JSON.stringify(JSON.parse(statement.data), null, 2)}</pre> */}
          </div>
        </div>
      </div>
    )
  } catch (err) {
    return <div>Error: {err.message}</div>
  }
}

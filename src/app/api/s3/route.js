// /pages/api/upload.js
import 'dotenv/config'
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function POST(req) {
  const { fileName, fileContent } = await req.json()

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(fileContent, 'base64'),
    ContentType: 'application/pdf',
  }

  try {
    const command = new PutObjectCommand(params)
    await s3Client.send(command)
    return new Response('File uploaded successfully.', { status: 200 })
  } catch (err) {
    return new Response(`Error uploading file. ${err}`, { status: 500 })
  }
}

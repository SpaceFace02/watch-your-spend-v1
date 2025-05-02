import 'dotenv/config'

export async function POST(req) {
  const { file_name, user_id } = await req.json()

  try {
    const response = await fetch(process.env.LAMBDA_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: file_name, user_id: user_id }),
    })

    const responseJSON = await response.json()

    if (response.ok) {
      return new Response('PDF processing registered.', { status: 200 })
    } else {
      const error = responseJSON.error
      return new Response(error, { status: 400 })
    }
  } catch (err) {
    const error = 'PDF processing failed.'
    return new Response(error, { status: 500 })
  }
}

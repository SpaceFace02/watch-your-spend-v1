const axios = require('axios')
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const https = require('https')
require('dotenv').config()

export async function GET(req) {
  // If user is logged in already, extract userData cookie.
  const cookies = req.cookies
  const userData = cookies.get('user_data')

  if (userData) {
    return new Response(JSON.stringify(userData), {
      status: 200,
    })
  } else {
    return new Response(
      JSON.stringify({ error: 'User is not authenticated.' }),
      {
        status: 401,
      }
    )
  }
}

export async function POST(req) {
  const { authCode } = await req.json()

  const tokenUrl = `${process.env.NEXT_PUBLIC_COGNITO_HOSTED_UI}/oauth2/token`

  const payload = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID,
    code: authCode,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
    client_secret: process.env.COGNITO_APP_CLIENT_SECRET,
  })

  const httpsAgent = new https.Agent({ rejectUnauthorized: false })

  try {
    const response = await axios.post(tokenUrl, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      httpsAgent: httpsAgent,
    })

    const responseData = response.data

    if (responseData.id_token) {
      return new Response(JSON.stringify({ id_token: responseData.id_token }), {
        status: 200,
      })
    } else {
      return new Response(JSON.stringify({ error: 'Authentication failed.' }), {
        status: 400,
      })
    }
  } catch (error) {
    console.error(`Error authenticating user: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
}

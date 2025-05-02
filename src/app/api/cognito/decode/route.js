require('dotenv').config()
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const https = require('https')

export async function POST(req) {
  const { idToken } = await req.json()

  const keysUrl = `https://cognito-idp.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`

  const client = jwksClient({
    jwksUri: keysUrl,
    requestHeaders: { 'User-Agent': 'custom-user-agent' },
  })

  try {
    const decodedJwtNoVerification = jwt.decode(idToken, { complete: true })
    const kid = decodedJwtNoVerification.header.kid
    const key = await client.getSigningKey(kid)
    const publicKey = key.getPublicKey()

    const decodedToken = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      audience: process.env.COGNITO_APP_CLIENT_ID,
    })
    // Return a response, and set a cookie with the decoded token
    return new Response(JSON.stringify(decodedToken), {
      status: 200,
    })
  } catch (error) {
    console.error(`Invalid token: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    })
  }
}

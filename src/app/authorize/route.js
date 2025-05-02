// app/api/authorize/route.js
import { NextResponse } from 'next/server'
import fetch from 'node-fetch'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    // Get the URL of the server
    return NextResponse.json(
      { message: 'Authorization code is missing' },
      { status: 400 }
    )
  }

  try {
    const domainURL = new URL('/', req.url)
    domainURL.pathname = '/api/cognito/authenticate'
    const authCodeResponse = await fetch(domainURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authCode: code }),
    })

    if (!authCodeResponse.ok) {
      return NextResponse.json(
        { message: 'Failed to exchange token' },
        { status: 401 }
      )
    }

    const { id_token } = await authCodeResponse.json()

    if (!id_token) {
      return NextResponse.json(
        { message: 'Invalid token response' },
        { status: 401 }
      )
    }

    domainURL.pathname = '/api/cognito/decode'
    const idTokenResponse = await fetch(domainURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: id_token }),
    })

    const userData = await idTokenResponse.json()

    const baseURL = new URL('/', req.url)
    // Set HTTP-only cookie with ID token
    const response = NextResponse.redirect(baseURL)
    response.cookies.set('user_data', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours expiry.
    })

    return response
  } catch (error) {
    console.error('Error during token exchange:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

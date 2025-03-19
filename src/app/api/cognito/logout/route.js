import 'dotenv/config'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const response = NextResponse.json({ message: 'Logged out' })
    response.cookies.set('user_data', '', { maxAge: 0, path: '/' })

    return response
  } catch (error) {
    console.error('Logout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

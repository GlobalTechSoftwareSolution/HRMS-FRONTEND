// app/api/proxy-users/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE

    if (!apiBase) {
      return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 })
    }

    const res = await fetch(`${apiBase}/accounts/users`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream server error' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

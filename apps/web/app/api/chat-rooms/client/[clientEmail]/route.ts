import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3003';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientEmail: string } }
) {
  try {
    const { clientEmail } = await params;
    const { searchParams } = new URL(request.url);
    const includeRecent = searchParams.get('recent') === 'true';
    const getHistory = searchParams.get('history') === 'true';
    
    let endpoint;
    if (getHistory) {
      endpoint = `${BACKEND_URL}/chat-rooms/client/${encodeURIComponent(clientEmail)}/history`;
    } else if (includeRecent) {
      endpoint = `${BACKEND_URL}/chat-rooms/client/${encodeURIComponent(clientEmail)}/recent`;
    } else {
      endpoint = `${BACKEND_URL}/chat-rooms/client/${encodeURIComponent(clientEmail)}`;
    }
    
    const response = await fetch(endpoint);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch chat room' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching chat room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
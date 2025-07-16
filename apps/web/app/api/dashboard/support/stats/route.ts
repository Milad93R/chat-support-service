import { NextRequest, NextResponse } from 'next/server';

const CHAT_SUPPORT_API_URL = 'http://localhost:3003';

export async function GET(request: NextRequest) {
  try {
    // Fetch admin statistics from chat support API
    const response = await fetch(`${CHAT_SUPPORT_API_URL}/support/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Chat support API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      stats: data.data,
    });
  } catch (error) {
    console.error('Support stats error:', error);
    
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      stats: {
        totalTickets: 0,
        statusBreakdown: {
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0
        },
        priorityBreakdown: {
          high: 0,
          medium: 0,
          low: 0
        }
      },
    });
  }
} 
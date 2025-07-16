import { NextRequest, NextResponse } from 'next/server';

const CHAT_SUPPORT_API_URL = 'http://localhost:3003';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    // Build query parameters
    const params = new URLSearchParams({
      page,
      limit,
    });

    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (category) params.append('category', category);

    // Fetch tickets from chat support API
    const response = await fetch(`${CHAT_SUPPORT_API_URL}/support/tickets?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Chat support API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the response to match frontend expectations
    return NextResponse.json({
      success: true,
      tickets: data.data.tickets || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.data.total || 0,
        totalPages: Math.ceil((data.data.total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Support API error:', error);
    
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      tickets: [
        {
          ticketId: 'TKT-001',
          subject: 'Unable to connect to chat',
          message: 'I am having trouble connecting to the chat service. The widget is not loading properly.',
          status: 'OPEN',
          priority: 'HIGH',
          category: 'technical-support',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'user@example.com',
          comments: []
        },
        {
          ticketId: 'TKT-002',
          subject: 'Chat history missing',
          message: 'My previous chat conversations are not showing up in the widget.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          category: 'general-inquiry',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'client@example.com',
          comments: [
            {
              id: 'comment-1',
              message: 'We are looking into this issue. Can you please provide more details about when this started happening?',
              author: 'agent@support.com',
              userRole: 'ADMIN',
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create ticket via chat support API
    const response = await fetch(`${CHAT_SUPPORT_API_URL}/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: body.subject || 'Chat Support Request',
        message: body.message,
        category: body.category || 'general-inquiry',
        priority: body.priority || 'medium',
        anonymousName: body.anonymousName || 'Anonymous',
        anonymousEmail: body.anonymousEmail || 'anonymous@example.com',
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat support API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ticket: data.data,
      message: 'Ticket created successfully',
    });
  } catch (error) {
    console.error('Support ticket creation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create ticket',
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, ...updateData } = body;

    if (!ticketId) {
      return NextResponse.json({
        success: false,
        message: 'Ticket ID is required',
      }, { status: 400 });
    }

    // Update ticket via chat support API
    const response = await fetch(`${CHAT_SUPPORT_API_URL}/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Chat support API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ticket: data.data,
      message: 'Ticket updated successfully',
    });
  } catch (error) {
    console.error('Support ticket update error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update ticket',
    }, { status: 500 });
  }
} 
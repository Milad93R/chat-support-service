import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-super-secret-key-123';

// Mock admin user data
const ADMIN_USER = {
  id: '6835502fa46f84d667bbd07b',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  isActive: true,
  isEmailVerified: true,
  isGoogleUser: false,
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        message: 'Authorization header required',
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Return user profile based on token
      if (decoded.email === ADMIN_USER.email) {
        return NextResponse.json({
          user: ADMIN_USER,
        });
      } else {
        return NextResponse.json({
          message: 'User not found',
        }, { status: 404 });
      }
    } catch (jwtError) {
      return NextResponse.json({
        message: 'Invalid or expired token',
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({
      message: 'Internal server error',
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-super-secret-key-123';

// Mock admin credentials - in production, this would be from a database
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123', // In production, this would be hashed
  id: '6835502fa46f84d667bbd07b',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  isActive: true,
  isEmailVerified: true,
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        message: 'Email and password are required',
      }, { status: 400 });
    }

    // Check credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      // Generate JWT token
      const token = jwt.sign(
        {
          email: ADMIN_CREDENTIALS.email,
          sub: ADMIN_CREDENTIALS.id,
          roles: ADMIN_CREDENTIALS.roles,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        access_token: token,
        user: {
          id: ADMIN_CREDENTIALS.id,
          email: ADMIN_CREDENTIALS.email,
          firstName: ADMIN_CREDENTIALS.firstName,
          lastName: ADMIN_CREDENTIALS.lastName,
          roles: ADMIN_CREDENTIALS.roles,
          isActive: ADMIN_CREDENTIALS.isActive,
          isEmailVerified: ADMIN_CREDENTIALS.isEmailVerified,
        },
      });
    } else {
      return NextResponse.json({
        message: 'Invalid credentials',
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      message: 'Internal server error',
    }, { status: 500 });
  }
} 
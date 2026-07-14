import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';
import { DemoAuthConfigurationError, getDemoAuthConfig } from '../config';

function equalSecret(received: string, expected: string): boolean {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  try {
    const config = getDemoAuthConfig();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        message: 'Email and password are required',
      }, { status: 400 });
    }

    if (email === config.adminEmail && equalSecret(password, config.adminPassword)) {
      const token = jwt.sign(
        {
          email: config.adminEmail,
          sub: 'demo-admin',
          roles: ['admin'],
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        access_token: token,
        user: {
          id: 'demo-admin',
          email: config.adminEmail,
          firstName: 'Demo',
          lastName: 'Administrator',
          roles: ['admin'],
          isActive: true,
          isEmailVerified: true,
        },
      });
    } else {
      return NextResponse.json({
        message: 'Invalid credentials',
      }, { status: 401 });
    }
  } catch (error) {
    if (error instanceof DemoAuthConfigurationError) {
      console.error(error.message);
      return NextResponse.json({
        message: 'Demo authentication is not configured',
      }, { status: 503 });
    }
    console.error('Login error:', error);
    return NextResponse.json({
      message: 'Internal server error',
    }, { status: 500 });
  }
}

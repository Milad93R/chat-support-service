import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { DemoAuthConfigurationError, getDemoAuthConfig } from '../config';

export async function GET(request: NextRequest) {
  try {
    const config = getDemoAuthConfig();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        message: 'Authorization header required',
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
      
      if (decoded.email === config.adminEmail) {
        return NextResponse.json({
          user: {
            id: 'demo-admin',
            email: config.adminEmail,
            firstName: 'Demo',
            lastName: 'Administrator',
            roles: ['admin'],
            isActive: true,
            isEmailVerified: true,
            isGoogleUser: false,
          },
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
    if (error instanceof DemoAuthConfigurationError) {
      console.error(error.message);
      return NextResponse.json({
        message: 'Demo authentication is not configured',
      }, { status: 503 });
    }
    console.error('Profile error:', error);
    return NextResponse.json({
      message: 'Internal server error',
    }, { status: 500 });
  }
}

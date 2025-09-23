import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import {UserModel} from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const authService = AuthService.getInstance();
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    let currentUser = null;
    if (decoded && typeof decoded !== 'string') {
      currentUser = await UserModel.findByPk(decoded.userId);
    }
    return NextResponse.json(currentUser || decoded);
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 });
  }
}

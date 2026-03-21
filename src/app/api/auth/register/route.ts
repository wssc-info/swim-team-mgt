import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    const { email, password, firstName, lastName, clubId } = userData;

    if (!email || !password || !firstName || !lastName || !clubId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const authService = AuthService.getInstance();
    const user = await authService.register({ ...userData, role: 'family', clubId });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

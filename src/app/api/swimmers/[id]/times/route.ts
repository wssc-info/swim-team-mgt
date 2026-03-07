import { NextRequest, NextResponse } from 'next/server';
import {UserModel} from "@/lib/models";
import {AuthService} from "@/lib/services/auth-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user: UserModel | null = await AuthService.getInstance().getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in.' }, { status: 401 });
    }

    return NextResponse.json({});
  } catch (error) {
    console.error('Error fetching swimmer times:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

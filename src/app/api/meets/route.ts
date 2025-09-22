import { NextRequest, NextResponse } from 'next/server';
import { MeetService } from '@/lib/services/meet-service';
import {UserModel} from "@/lib/models";
import {AuthService} from "@/lib/services/auth-service";

const meetService = MeetService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const user: UserModel | null = await AuthService.getInstance().getUser(request);
    const activeOnly = 'true' === request.nextUrl.searchParams.get('active')
    const meets = await meetService.getMeets(activeOnly, user?.clubId);
    return NextResponse.json(meets);
  } catch (error) {
    console.error('Error fetching meets:', error);
    return NextResponse.json({ error: 'Failed to fetch meets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }
    
    const meet = await meetService.addMeet(body);
    return NextResponse.json(meet);
  } catch (error) {
    console.error('Error adding meet:', error);
    return NextResponse.json({ error: 'Failed to add meet' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getMeets, addMeet } from '@/lib/swimmers';

export async function GET() {
  try {
    const meets = await getMeets();
    return NextResponse.json(meets);
  } catch (error) {
    console.error('Error fetching meets:', error);
    return NextResponse.json({ error: 'Failed to fetch meets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meet = await addMeet(body);
    return NextResponse.json(meet);
  } catch (error) {
    console.error('Error adding meet:', error);
    return NextResponse.json({ error: 'Failed to add meet' }, { status: 500 });
  }
}

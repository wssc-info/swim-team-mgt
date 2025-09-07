import { NextRequest, NextResponse } from 'next/server';
import { SwimmerService } from '@/lib/services/swimmer-service';

const swimmerService = SwimmerService.getInstance();

export async function GET() {
  try {
    const swimmers = await swimmerService.getSwimmers();
    return NextResponse.json(swimmers);
  } catch (error) {
    console.error('Error fetching swimmers:', error);
    return NextResponse.json({ error: 'Failed to fetch swimmers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const swimmer = await swimmerService.addSwimmer(body);
    return NextResponse.json(swimmer);
  } catch (error) {
    console.error('Error adding swimmer:', error);
    return NextResponse.json({ error: 'Failed to add swimmer' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { RelayTeamService } from '@/lib/services/relay-team-service';

const relayTeamService = RelayTeamService.getInstance();

export async function GET() {
  try {
    const relayTeams = await relayTeamService.getRelayTeams();
    return NextResponse.json(relayTeams);
  } catch (error) {
    console.error('Error fetching relay teams:', error);
    return NextResponse.json({ error: 'Failed to fetch relay teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const relayTeam = await relayTeamService.addRelayTeam(body);
    return NextResponse.json(relayTeam);
  } catch (error) {
    console.error('Error adding relay team:', error);
    return NextResponse.json({ error: 'Failed to add relay team' }, { status: 500 });
  }
}

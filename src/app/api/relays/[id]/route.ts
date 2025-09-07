import { NextRequest, NextResponse } from 'next/server';
import { RelayTeamService } from '@/lib/services/relay-team-service';

const relayTeamService = RelayTeamService.getInstance();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await relayTeamService.updateRelayTeam(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating relay team:', error);
    return NextResponse.json({ error: 'Failed to update relay team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await relayTeamService.deleteRelayTeam(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting relay team:', error);
    return NextResponse.json({ error: 'Failed to delete relay team' }, { status: 500 });
  }
}

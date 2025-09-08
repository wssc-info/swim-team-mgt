import { NextRequest, NextResponse } from 'next/server';
import { RelayTeamService } from '@/lib/services/relay-team-service';

const relayTeamService = RelayTeamService.getInstance();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  try {
    const body = await request.json();
    await relayTeamService.updateRelayTeam(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating relay team:', error);
    return NextResponse.json({ error: 'Failed to update relay team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  try {
    await relayTeamService.deleteRelayTeam(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting relay team:', error);
    return NextResponse.json({ error: 'Failed to delete relay team' }, { status: 500 });
  }
}

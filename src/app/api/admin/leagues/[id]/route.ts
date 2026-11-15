import { NextRequest, NextResponse } from 'next/server';
import { LeagueModel, SwimClubModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

async function requireAdmin(request: NextRequest) {
  const user = await AuthService.getInstance().getUser(request);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase();
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const updates = await request.json();
    const league = await LeagueModel.findByPk(id);
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    if (updates.abbreviation) updates.abbreviation = updates.abbreviation.toUpperCase();
    await league.update(updates);
    return NextResponse.json(league);
  } catch (error) {
    console.error('Error updating league:', error);
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase();
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const clubCount = await SwimClubModel.count({ where: { leagueId: id } });
    if (clubCount > 0) {
      return NextResponse.json({ error: 'Cannot delete league with assigned clubs' }, { status: 409 });
    }

    await LeagueModel.destroy({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting league:', error);
    return NextResponse.json({ error: 'Failed to delete league' }, { status: 500 });
  }
}

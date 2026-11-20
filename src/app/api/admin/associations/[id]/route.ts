import { NextRequest, NextResponse } from 'next/server';
import {
  FamilySwimmerAssociationModel,
  SwimmerModel,
  initializeDatabase,
} from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'coach' && user.role !== 'admin' && user.role !== 'leagueAdmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json(); // 'approve' | 'deny'

    if (action !== 'approve' && action !== 'deny') {
      return NextResponse.json({ error: 'action must be approve or deny' }, { status: 400 });
    }

    const association = await FamilySwimmerAssociationModel.findByPk(id);
    if (!association) {
      return NextResponse.json({ error: 'Association not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';
    await association.update({ status: newStatus });

    // If approving and swimmer has no club, assign the coach's club
    if (action === 'approve' && user.clubId) {
      const swimmer = await SwimmerModel.findByPk(association.swimmerId);
      if (swimmer && !swimmer.clubId) {
        await swimmer.update({ clubId: user.clubId, active: true });
      }
    }

    return NextResponse.json({ id: association.id, status: newStatus });
  } catch (error) {
    console.error('Error updating association:', error);
    return NextResponse.json({ error: 'Failed to update association' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'coach' && user.role !== 'admin' && user.role !== 'leagueAdmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const association = await FamilySwimmerAssociationModel.findByPk(id);
    if (!association) {
      return NextResponse.json({ error: 'Association not found' }, { status: 404 });
    }

    await association.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting association:', error);
    return NextResponse.json({ error: 'Failed to delete association' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { SwimmerService } from '@/lib/services/swimmer-service';
import { FamilySwimmerAssociationModel, SwimmerModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';
import {Swimmer} from "@/lib/types";
import {generateSwimmerExternalId} from "@/lib/utils";

const swimmerService = SwimmerService.getInstance();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  try {
    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'leagueAdmin' && user.role !== 'coach')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Non-admins can only edit swimmers belonging to their club
    if (user.role !== 'admin' && user.role !== 'leagueAdmin') {
      await initializeDatabase();
      const swimmer = await SwimmerModel.findByPk(id);
      if (!swimmer || swimmer.clubId !== user.clubId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body: Partial<Swimmer> = await request.json();
    if (!body.externalId) {
      body.externalId = generateSwimmerExternalId(body)
    }
    await swimmerService.updateSwimmer(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating swimmer:', error);
    return NextResponse.json({ error: 'Failed to update swimmer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'leagueAdmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await initializeDatabase();
    const associations = await FamilySwimmerAssociationModel.findAll({ where: { swimmerId: id } });
    if (associations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a swimmer who is associated with a family. Remove the family association first.' },
        { status: 409 }
      );
    }
    await swimmerService.deleteSwimmer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting swimmer:', error);
    return NextResponse.json({ error: 'Failed to delete swimmer' }, { status: 500 });
  }
}

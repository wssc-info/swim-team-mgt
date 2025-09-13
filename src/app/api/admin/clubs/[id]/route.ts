import { NextRequest, NextResponse } from 'next/server';
import { SwimClubModel, initializeDatabase } from '@/lib/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const { id } = await params;
    const updates = await request.json();
    
    const club = await SwimClubModel.findByPk(id);
    if (!club) {
      return NextResponse.json({ error: 'Swim club not found' }, { status: 404 });
    }

    // Ensure abbreviation is uppercase
    if (updates.abbreviation) {
      updates.abbreviation = updates.abbreviation.toUpperCase();
    }

    await club.update(updates);
    
    return NextResponse.json(club);
  } catch (error: any) {
    console.error('Error updating swim club:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ 
        error: 'A club with this abbreviation already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to update swim club' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const { id } = await params;
    
    const club = await SwimClubModel.findByPk(id);
    if (!club) {
      return NextResponse.json({ error: 'Swim club not found' }, { status: 404 });
    }

    await club.destroy();
    
    return NextResponse.json({ message: 'Swim club deleted successfully' });
  } catch (error) {
    console.error('Error deleting swim club:', error);
    return NextResponse.json({ error: 'Failed to delete swim club' }, { status: 500 });
  }
}

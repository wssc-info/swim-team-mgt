import { NextRequest, NextResponse } from 'next/server';
import { FamilySwimmerAssociationModel, initializeDatabase } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const associations = await FamilySwimmerAssociationModel.findAll({
      where: { userId: params.id }
    });

    const swimmerIds = associations.map(assoc => assoc.swimmerId);
    return NextResponse.json(swimmerIds);
  } catch (error) {
    console.error('Error fetching associations:', error);
    return NextResponse.json({ error: 'Failed to fetch associations' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    
    const { swimmerIds } = await request.json();

    // Delete existing associations
    await FamilySwimmerAssociationModel.destroy({
      where: { userId: params.id }
    });

    // Create new associations
    const associations = swimmerIds.map((swimmerId: string) => ({
      id: uuidv4(),
      userId: params.id,
      swimmerId,
    }));

    if (associations.length > 0) {
      await FamilySwimmerAssociationModel.bulkCreate(associations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating associations:', error);
    return NextResponse.json({ error: 'Failed to update associations' }, { status: 500 });
  }
}

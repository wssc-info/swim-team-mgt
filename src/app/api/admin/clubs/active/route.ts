import { NextResponse } from 'next/server';
import { SwimClubModel, initializeDatabase } from '@/lib/models';

export async function GET() {
  try {
    await initializeDatabase();
    
    const activeClub = await SwimClubModel.findOne({
      where: { isActive: true }
    });
    
    return NextResponse.json(activeClub);
  } catch (error) {
    console.error('Error fetching active swim club:', error);
    return NextResponse.json({ error: 'Failed to fetch active swim club' }, { status: 500 });
  }
}

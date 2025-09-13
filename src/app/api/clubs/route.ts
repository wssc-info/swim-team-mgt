import { NextResponse } from 'next/server';
import { SwimClubModel, initializeDatabase } from '@/lib/models';

export async function GET() {
  try {
    await initializeDatabase();
    
    const clubs = await SwimClubModel.findAll({
      attributes: ['id', 'name', 'abbreviation', 'isActive'],
      order: [['name', 'ASC']]
    });
    
    return NextResponse.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

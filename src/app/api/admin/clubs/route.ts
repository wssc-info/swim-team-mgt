import { NextRequest, NextResponse } from 'next/server';
import { SwimClubModel, initializeDatabase } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    await initializeDatabase();
    
    const clubs = await SwimClubModel.findAll({
      order: [['name', 'ASC']]
    });
    
    return NextResponse.json(clubs);
  } catch (error) {
    console.error('Error fetching swim clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch swim clubs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const clubData = await request.json();
    const { name, abbreviation, address, city, state, zipCode, phone, email, website } = clubData;
    
    if (!name || !abbreviation || !address || !city || !state || !zipCode) {
      return NextResponse.json({ 
        error: 'Name, abbreviation, address, city, state, and zip code are required' 
      }, { status: 400 });
    }

    const club = await SwimClubModel.create({
      id: uuidv4(),
      name,
      abbreviation: abbreviation.toUpperCase(),
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      isActive: true
    });

    return NextResponse.json(club, { status: 201 });
  } catch (error: any) {
    console.error('Error creating swim club:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ 
        error: 'A club with this abbreviation already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create swim club' }, { status: 500 });
  }
}

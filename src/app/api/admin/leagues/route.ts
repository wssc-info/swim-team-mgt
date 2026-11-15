import { NextRequest, NextResponse } from 'next/server';
import { LeagueModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';
import { v4 as uuidv4 } from 'uuid';

async function requireAdmin(request: NextRequest) {
  const user = await AuthService.getInstance().getUser(request);
  if (!user) return null;
  if (user.role !== 'admin') return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const leagues = await LeagueModel.findAll({ order: [['name', 'ASC']] });
    return NextResponse.json(leagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, abbreviation, description, isActive } = await request.json();
    if (!name || !abbreviation) {
      return NextResponse.json({ error: 'Name and abbreviation are required' }, { status: 400 });
    }

    const league = await LeagueModel.create({
      id: uuidv4(),
      name,
      abbreviation: abbreviation.toUpperCase(),
      description: description || undefined,
      isActive: isActive ?? true,
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error('Error creating league:', error);
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 });
  }
}

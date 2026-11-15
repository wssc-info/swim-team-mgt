import { NextRequest, NextResponse } from 'next/server';
import { MeetTemplateModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const user = await AuthService.getInstance().getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const templates = await MeetTemplateModel.findAll({ order: [['name', 'ASC']] });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching meet templates:', error);
    return NextResponse.json({ error: 'Failed to fetch meet templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const user = await AuthService.getInstance().getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'leagueAdmin', 'coach'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, scope, leagueId, clubId, course, meetEvents, availableEvents } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const template = await MeetTemplateModel.create({
      id: uuidv4(),
      name,
      description: description || undefined,
      scope: scope || 'club',
      leagueId: leagueId || undefined,
      clubId: clubId || undefined,
      course: course || 'SCY',
      meetEvents: JSON.stringify(meetEvents || []),
      availableEvents: JSON.stringify(availableEvents || []),
    });

    return NextResponse.json({
      ...template.toJSON(),
      meetEvents: JSON.parse(template.meetEvents),
      availableEvents: JSON.parse(template.availableEvents),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating meet template:', error);
    return NextResponse.json({ error: 'Failed to create meet template' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { MeetTemplateModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase();
    const user = await AuthService.getInstance().getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'leagueAdmin', 'coach'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const template = await MeetTemplateModel.findByPk(id);
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const { name, description, scope, leagueId, clubId, course, meetEvents, availableEvents } = await request.json();
    await template.update({
      name: name ?? template.name,
      description: description !== undefined ? description : template.description,
      scope: scope ?? template.scope,
      leagueId: leagueId !== undefined ? (leagueId || undefined) : template.leagueId,
      clubId: clubId !== undefined ? (clubId || undefined) : template.clubId,
      course: course ?? template.course,
      meetEvents: meetEvents !== undefined ? JSON.stringify(meetEvents) : template.meetEvents,
      availableEvents: availableEvents !== undefined ? JSON.stringify(availableEvents) : template.availableEvents,
    });

    return NextResponse.json({
      ...template.toJSON(),
      meetEvents: JSON.parse(template.meetEvents),
      availableEvents: JSON.parse(template.availableEvents),
    });
  } catch (error) {
    console.error('Error updating meet template:', error);
    return NextResponse.json({ error: 'Failed to update meet template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase();
    const user = await AuthService.getInstance().getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'leagueAdmin', 'coach'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await MeetTemplateModel.destroy({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meet template:', error);
    return NextResponse.json({ error: 'Failed to delete meet template' }, { status: 500 });
  }
}

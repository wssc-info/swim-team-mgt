import { NextRequest, NextResponse } from 'next/server';
import { SwimEventModel, initializeDatabase } from '@/lib/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    
    const event = await SwimEventModel.findByPk(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const eventData = await request.json();
    const { name, distance, stroke, course, isRelay, ageGroups, isActive } = eventData;
    
    await event.update({
      name: name || event.name,
      distance: distance !== undefined ? parseInt(distance) : event.distance,
      stroke: stroke || event.stroke,
      course: course || event.course,
      isRelay: isRelay !== undefined ? Boolean(isRelay) : event.isRelay,
      ageGroups: ageGroups !== undefined ? JSON.stringify(ageGroups) : event.ageGroups,
      isActive: isActive !== undefined ? Boolean(isActive) : event.isActive
    });
    
    const formattedEvent = {
      id: event.id,
      name: event.name,
      distance: event.distance,
      stroke: event.stroke,
      course: event.course,
      isRelay: event.isRelay,
      ageGroups: JSON.parse(event.ageGroups),
      isActive: event.isActive,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    };
    
    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    
    const event = await SwimEventModel.findByPk(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    await event.destroy();
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

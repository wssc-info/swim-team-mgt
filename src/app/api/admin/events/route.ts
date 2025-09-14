import { NextRequest, NextResponse } from 'next/server';
import { SwimEventModel, initializeDatabase } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    await initializeDatabase();
    
    const events = await SwimEventModel.findAll({
      order: [['course', 'ASC'], ['stroke', 'ASC'], ['distance', 'ASC']]
    });
    
    const formattedEvents = events.map(event => ({
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
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const eventData = await request.json();
    const { name, distance, stroke, course, isRelay, ageGroups, isActive } = eventData;
    
    if (!name || !distance || !stroke || !course || ageGroups === undefined) {
      return NextResponse.json({ 
        error: 'Name, distance, stroke, course, and age groups are required' 
      }, { status: 400 });
    }
    
    const event = await SwimEventModel.create({
      id: uuidv4(),
      name,
      distance: parseInt(distance),
      stroke,
      course,
      isRelay: Boolean(isRelay),
      ageGroups: JSON.stringify(ageGroups),
      isActive: isActive !== undefined ? Boolean(isActive) : true
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
    
    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

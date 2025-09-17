import { SwimEventModel, initializeDatabase } from './models';
import { SwimEvent } from './types';

// Default USA Swimming events data for seeding
export const USA_SWIMMING_EVENTS_SEED : SwimEvent[] = [
  // SCY Individual Freestyle Events
  { id: '50-free-scy', name: '50 Freestyle', distance: 50, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-free-scy', name: '100 Freestyle', distance: 100, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-scy', name: '200 Freestyle', distance: 200, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '500-free-scy', name: '500 Freestyle', distance: 500, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '1000-free-scy', name: '1000 Freestyle', distance: 1000, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '1650-free-scy', name: '1650 Freestyle', distance: 1650, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['15-18'], isActive: true },

  // SCM Individual Freestyle Events
  { id: '50-free-scm', name: '50 Freestyle', distance: 50, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-free-scm', name: '100 Freestyle', distance: 100, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-scm', name: '200 Freestyle', distance: 200, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-scm', name: '400 Freestyle', distance: 400, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-scm', name: '800 Freestyle', distance: 800, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '1500-free-scm', name: '1500 Freestyle', distance: 1500, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['15-18'], isActive: true },

  // SCY Individual Backstroke Events
  { id: '25-back-scy', name: '25 Backstroke', distance: 25, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-back-scy', name: '50 Backstroke', distance: 50, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-back-scy', name: '100 Backstroke', distance: 100, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-back-scy', name: '200 Backstroke', distance: 200, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCM Individual Backstroke Events
  { id: '50-back-scm', name: '50 Backstroke', distance: 50, stroke: 'backstroke', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-back-scm', name: '100 Backstroke', distance: 100, stroke: 'backstroke', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-back-scm', name: '200 Backstroke', distance: 200, stroke: 'backstroke', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCY Individual Breaststroke Events
  { id: '25-breast-scy', name: '25 Breaststroke', distance: 25, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-breast-scy', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-breast-scy', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-breast-scy', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCM Individual Breaststroke Events
  { id: '50-breast-scm', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-breast-scm', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-breast-scm', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCY Individual Butterfly Events
  { id: '25-fly-scy', name: '25 Butterfly', distance: 25, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-fly-scy', name: '50 Butterfly', distance: 50, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-fly-scy', name: '100 Butterfly', distance: 100, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-fly-scy', name: '200 Butterfly', distance: 200, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCM Individual Butterfly Events
  { id: '50-fly-scm', name: '50 Butterfly', distance: 50, stroke: 'butterfly', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-fly-scm', name: '100 Butterfly', distance: 100, stroke: 'butterfly', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-fly-scm', name: '200 Butterfly', distance: 200, stroke: 'butterfly', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCY Individual Medley Events
  { id: '100-im-scy', name: '100 Individual Medley', distance: 100, stroke: 'medley', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12'], isActive: true },
  { id: '200-im-scy', name: '200 Individual Medley', distance: 200, stroke: 'medley', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '400-im-scy', name: '400 Individual Medley', distance: 400, stroke: 'medley', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCM Individual Medley Events
  { id: '100-im-scm', name: '100 Individual Medley', distance: 100, stroke: 'medley', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12'], isActive: true },
  { id: '200-im-scm', name: '200 Individual Medley', distance: 200, stroke: 'medley', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '400-im-scm', name: '400 Individual Medley', distance: 400, stroke: 'medley', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCY Relay Events
  { id: '100-free-relay-scy', name: '100 Freestyle Relay', distance: 100, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-relay-scy', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-relay-scy', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-relay-scy', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '200-medley-relay-scy', name: '200 Medley Relay', distance: 200, stroke: 'medley', course: 'SCY', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-medley-relay-scy', name: '400 Medley Relay', distance: 400, stroke: 'medley', course: 'SCY', isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },

  // SCM Relay Events
  { id: '200-free-relay-scm', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle', course: 'SCM', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-relay-scm', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle', course: 'SCM', isRelay: true, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-relay-scm', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle', course: 'SCM', isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '200-medley-relay-scm', name: '200 Medley Relay', distance: 200, stroke: 'medley', course: 'SCM', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-medley-relay-scm', name: '400 Medley Relay', distance: 400, stroke: 'medley', course: 'SCM', isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
];

// Database functions
export async function getAllEvents(): Promise<SwimEvent[]> {
  await initializeDatabase();
  const events = await SwimEventModel.findAll({
    where: { isActive: true },
    order: [['course', 'ASC'], ['stroke', 'ASC'], ['distance', 'ASC']]
  });
  
  return events.map(event => ({
    id: event.id,
    name: event.name,
    distance: event.distance,
    stroke: event.stroke,
    course: event.course,
    isRelay: event.isRelay,
    ageGroups: JSON.parse(event.ageGroups),
    isActive: event.isActive
  }));
}

export async function getEventsByAgeGroup(ageGroup: string): Promise<SwimEvent[]> {
  const allEvents = await getAllEvents();
  return allEvents.filter(event => event.ageGroups.includes(ageGroup));
}

export async function getIndividualEvents(): Promise<SwimEvent[]> {
  const allEvents = await getAllEvents();
  return allEvents.filter(event => !event.isRelay);
}

export async function getRelayEvents(): Promise<SwimEvent[]> {
  const allEvents = await getAllEvents();
  return allEvents.filter(event => event.isRelay);
}

// Seed function to populate database with default events
export async function seedEvents(): Promise<void> {
  await initializeDatabase();
  
  for (const eventData of USA_SWIMMING_EVENTS_SEED) {
    const existingEvent = await SwimEventModel.findByPk(eventData.id);
    if (!existingEvent) {
      await SwimEventModel.create({
        ...eventData,
        ageGroups: JSON.stringify(eventData.ageGroups)
      });
    }
  }
}

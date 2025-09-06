export interface SwimEvent {
  id: string;
  name: string;
  distance: number;
  stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'individual-medley';
  course: 'SCY' | 'LCM' | 'SCM'; // Short Course Yards, Long Course Meters, Short Course Meters
  isRelay: boolean;
  ageGroups: string[];
}

export const USA_SWIMMING_EVENTS: SwimEvent[] = [
  // SCY Individual Freestyle Events
  { id: '50-free-scy', name: '50 Freestyle', distance: 50, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'] },
  { id: '100-free-scy', name: '100 Freestyle', distance: 100, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'] },
  { id: '200-free-scy', name: '200 Freestyle', distance: 200, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '500-free-scy', name: '500 Freestyle', distance: 500, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '1000-free-scy', name: '1000 Freestyle', distance: 1000, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'] },
  { id: '1650-free-scy', name: '1650 Freestyle', distance: 1650, stroke: 'freestyle', course: 'SCY', isRelay: false, ageGroups: ['15-18'] },

  // SCM Individual Freestyle Events
  { id: '50-free-scm', name: '50 Freestyle', distance: 50, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'] },
  { id: '100-free-scm', name: '100 Freestyle', distance: 100, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'] },
  { id: '200-free-scm', name: '200 Freestyle', distance: 200, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '400-free-scm', name: '400 Freestyle', distance: 400, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '800-free-scm', name: '800 Freestyle', distance: 800, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'] },
  { id: '1500-free-scm', name: '1500 Freestyle', distance: 1500, stroke: 'freestyle', course: 'SCM', isRelay: false, ageGroups: ['15-18'] },

  // SCY Individual Backstroke Events
  { id: '25-back-scy', name: '25 Backstroke', distance: 25, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['8&U'] },
  { id: '50-back-scy', name: '50 Backstroke', distance: 50, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '100-back-scy', name: '100 Backstroke', distance: 100, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '200-back-scy', name: '200 Backstroke', distance: 200, stroke: 'backstroke', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCM Individual Backstroke Events
  { id: '50-back-scm', name: '50 Backstroke', distance: 50, stroke: 'backstroke', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '100-back-scm', name: '100 Backstroke', distance: 100, stroke: 'backstroke', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '200-back-scm', name: '200 Backstroke', distance: 200, stroke: 'backstroke', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCY Individual Breaststroke Events
  { id: '25-breast-scy', name: '25 Breaststroke', distance: 25, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['8&U'] },
  { id: '50-breast-scy', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '100-breast-scy', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '200-breast-scy', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCM Individual Breaststroke Events
  { id: '50-breast-scm', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '100-breast-scm', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '200-breast-scm', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCY Individual Butterfly Events
  { id: '25-fly-scy', name: '25 Butterfly', distance: 25, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['8&U'] },
  { id: '50-fly-scy', name: '50 Butterfly', distance: 50, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '100-fly-scy', name: '100 Butterfly', distance: 100, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '200-fly-scy', name: '200 Butterfly', distance: 200, stroke: 'butterfly', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCM Individual Butterfly Events
  { id: '50-fly-scm', name: '50 Butterfly', distance: 50, stroke: 'butterfly', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '100-fly-scm', name: '100 Butterfly', distance: 100, stroke: 'butterfly', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '200-fly-scm', name: '200 Butterfly', distance: 200, stroke: 'butterfly', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCY Individual Medley Events
  { id: '100-im-scy', name: '100 Individual Medley', distance: 100, stroke: 'individual-medley', course: 'SCY', isRelay: false, ageGroups: ['9-10', '11-12'] },
  { id: '200-im-scy', name: '200 Individual Medley', distance: 200, stroke: 'individual-medley', course: 'SCY', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '400-im-scy', name: '400 Individual Medley', distance: 400, stroke: 'individual-medley', course: 'SCY', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCM Individual Medley Events
  { id: '100-im-scm', name: '100 Individual Medley', distance: 100, stroke: 'individual-medley', course: 'SCM', isRelay: false, ageGroups: ['9-10', '11-12'] },
  { id: '200-im-scm', name: '200 Individual Medley', distance: 200, stroke: 'individual-medley', course: 'SCM', isRelay: false, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '400-im-scm', name: '400 Individual Medley', distance: 400, stroke: 'individual-medley', course: 'SCM', isRelay: false, ageGroups: ['13-14', '15-18'] },

  // SCY Relay Events
  { id: '100-free-relay-scy', name: '100 Freestyle Relay', distance: 100, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'] },
  { id: '200-free-relay-scy', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '400-free-relay-scy', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '800-free-relay-scy', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle', course: 'SCY', isRelay: true, ageGroups: ['13-14', '15-18'] },
  { id: '200-medley-relay-scy', name: '200 Medley Relay', distance: 200, stroke: 'individual-medley', course: 'SCY', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '400-medley-relay-scy', name: '400 Medley Relay', distance: 400, stroke: 'individual-medley', course: 'SCY', isRelay: true, ageGroups: ['13-14', '15-18'] },

  // SCM Relay Events
  { id: '200-free-relay-scm', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle', course: 'SCM', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '400-free-relay-scm', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle', course: 'SCM', isRelay: true, ageGroups: ['11-12', '13-14', '15-18'] },
  { id: '800-free-relay-scm', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle', course: 'SCM', isRelay: true, ageGroups: ['13-14', '15-18'] },
  { id: '200-medley-relay-scm', name: '200 Medley Relay', distance: 200, stroke: 'individual-medley', course: 'SCM', isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'] },
  { id: '400-medley-relay-scm', name: '400 Medley Relay', distance: 400, stroke: 'individual-medley', course: 'SCM', isRelay: true, ageGroups: ['13-14', '15-18'] },
];

export function getEventsByAgeGroup(ageGroup: string): SwimEvent[] {
  return USA_SWIMMING_EVENTS.filter(event => event.ageGroups.includes(ageGroup));
}

export function getIndividualEvents(): SwimEvent[] {
  return USA_SWIMMING_EVENTS.filter(event => !event.isRelay);
}

export function getRelayEvents(): SwimEvent[] {
  return USA_SWIMMING_EVENTS.filter(event => event.isRelay);
}

// Type definitions
interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
}

interface SwimmerMeetEvent {
  id: string;
  swimmerId: string;
  meetId: string;
  eventId: string;
  seedTime?: string;
  createdAt: string;
}

interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  availableEvents: string[];
  isActive: boolean;
  createdAt: string;
}

interface RelayTeam {
  id: string;
  eventId: string;
  name: string;
  swimmers: string[];
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

interface TimeRecord {
  id: string;
  swimmerId: string;
  eventId: string;
  time: string;
  meetName: string;
  meetDate: string;
  isPersonalBest: boolean;
  createdAt: string;
}

// Swimmers API
export async function fetchSwimmers(): Promise<Swimmer[]> {
  const response = await fetch('/api/swimmers');
  if (!response.ok) {
    throw new Error('Failed to fetch swimmers');
  }
  return response.json();
}

export async function createSwimmer(swimmer: Omit<Swimmer, 'id' | 'ageGroup'>): Promise<Swimmer> {
  const response = await fetch('/api/swimmers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(swimmer),
  });
  if (!response.ok) {
    throw new Error('Failed to create swimmer');
  }
  return response.json();
}

export async function updateSwimmerApi(id: string, updates: Partial<Swimmer>): Promise<void> {
  const response = await fetch(`/api/swimmers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update swimmer');
  }
}

export async function deleteSwimmerApi(id: string): Promise<void> {
  const response = await fetch(`/api/swimmers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete swimmer');
  }
}

// Meets API
export async function fetchMeets(): Promise<Meet[]> {
  const response = await fetch('/api/meets');
  if (!response.ok) {
    throw new Error('Failed to fetch meets');
  }
  return response.json();
}

export async function createMeet(meet: Omit<Meet, 'id' | 'createdAt'>): Promise<Meet> {
  const response = await fetch('/api/meets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meet),
  });
  if (!response.ok) {
    throw new Error('Failed to create meet');
  }
  return response.json();
}

export async function updateMeetApi(id: string, updates: Partial<Meet>): Promise<void> {
  const response = await fetch(`/api/meets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update meet');
  }
}

export async function deleteMeetApi(id: string): Promise<void> {
  const response = await fetch(`/api/meets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete meet');
  }
}

export async function activateMeet(id: string): Promise<void> {
  const response = await fetch(`/api/meets/${id}/activate`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to activate meet');
  }
}

// Export API
export async function exportMeetData(meetId?: string): Promise<{ content: string; fileName: string }> {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meetId }),
  });
  if (!response.ok) {
    throw new Error('Failed to export meet data');
  }
  const data = await response.json();
  return { content: data.content, fileName: data.fileName };
}

// Time Records API
export async function fetchTimeRecords(swimmerId?: string): Promise<TimeRecord[]> {
  const url = swimmerId ? `/api/times?swimmerId=${swimmerId}` : '/api/times';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch time records');
  }
  return response.json();
}

export async function createTimeRecord(record: Omit<TimeRecord, 'id' | 'createdAt' | 'isPersonalBest'>): Promise<TimeRecord> {
  const response = await fetch('/api/times', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error('Failed to create time record');
  }
  return response.json();
}

export async function updateTimeRecordApi(id: string, updates: Partial<TimeRecord>): Promise<void> {
  const response = await fetch(`/api/times/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update time record');
  }
}

export async function deleteTimeRecordApi(id: string): Promise<void> {
  const response = await fetch(`/api/times/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete time record');
  }
}

// Family API
export async function fetchAssociatedSwimmers(userId: string): Promise<Swimmer[]> {
  const response = await fetch(`/api/swimmers?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch associated swimmers');
  }
  return response.json();
}

// Relay Teams API
export async function fetchRelayTeams(): Promise<RelayTeam[]> {
  const response = await fetch('/api/relays');
  if (!response.ok) {
    throw new Error('Failed to fetch relay teams');
  }
  return response.json();
}

export async function createRelayTeam(team: Omit<RelayTeam, 'id'>): Promise<RelayTeam> {
  const response = await fetch('/api/relays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(team),
  });
  if (!response.ok) {
    throw new Error('Failed to create relay team');
  }
  return response.json();
}

export async function updateRelayTeamApi(id: string, updates: Partial<RelayTeam>): Promise<void> {
  const response = await fetch(`/api/relays/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update relay team');
  }
}

export async function deleteRelayTeamApi(id: string): Promise<void> {
  const response = await fetch(`/api/relays/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete relay team');
  }
}

// Swimmer Meet Events API
export async function fetchSwimmerMeetEvents(swimmerId: string, meetId: string): Promise<SwimmerMeetEvent[]> {
  const response = await fetch(`/api/swimmer-meet-events?swimmerId=${swimmerId}&meetId=${meetId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch swimmer meet events');
  }
  return response.json();
}

export async function updateSwimmerMeetEvents(
  swimmerId: string, 
  meetId: string, 
  eventSelections: { eventId: string; seedTime?: string }[]
): Promise<void> {
  const response = await fetch('/api/swimmer-meet-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ swimmerId, meetId, eventSelections }),
  });
  if (!response.ok) {
    throw new Error('Failed to update swimmer meet events');
  }
}

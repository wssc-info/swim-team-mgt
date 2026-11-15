// Helper function to make authenticated API calls
import {SwimEvent, SwimClub, Swimmer, Meet, TimeRecord, RelayTeam, SwimmerMeetEvent, League, MeetTemplate, User} from "@/lib/types";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

// Swimmers API
export async function fetchSwimmers(clubId?: string, includeInactive?: boolean): Promise<Swimmer[]> {
  const response = await authenticatedFetch('/api/swimmers?' + (clubId ? `clubId=${clubId}` : '') + (includeInactive ? `showInactive=${includeInactive}` : ''));
  if (!response.ok) {
    throw new Error('Failed to fetch swimmers');
  }
  return response.json();
}

export async function createSwimmer(swimmer: Omit<Swimmer, 'id' | 'ageGroup'>): Promise<Swimmer> {
  const response = await authenticatedFetch('/api/swimmers', {
    method: 'POST',
    body: JSON.stringify(swimmer),
  });
  if (!response.ok) {
    throw new Error('Failed to create swimmer');
  }
  return response.json();
}

export async function updateSwimmerApi(id: string, updates: Partial<Swimmer>): Promise<void> {
  const response = await authenticatedFetch(`/api/swimmers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update swimmer');
  }
}

export async function deleteSwimmerApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/swimmers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete swimmer');
  }
}

// Meets API
export async function fetchMeets(active: boolean = false, clubId?: string): Promise<Meet[]> {
  const params = new URLSearchParams({ active: String(active) });
  if (clubId) params.set('clubId', clubId);
  const response = await authenticatedFetch(`/api/meets?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch meets');
  }
  return response.json();
}

export async function createMeet(meet: Omit<Meet, 'id' | 'createdAt'>): Promise<Meet> {
  const response = await authenticatedFetch('/api/meets', {
    method: 'POST',
    body: JSON.stringify(meet),
  });
  if (!response.ok) {
    throw new Error('Failed to create meet');
  }
  return response.json();
}

export async function updateMeetApi(id: string, updates: Partial<Meet>): Promise<void> {
  const response = await authenticatedFetch(`/api/meets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update meet');
  }
}

export async function deleteMeetApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/meets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete meet');
  }
}

export async function activateMeet(id: string, clubId?: string): Promise<void> {
  const response = await authenticatedFetch(`/api/meets/${id}/activate`, {
    method: 'PUT',
    body: JSON.stringify({ clubId }),
  });
  if (!response.ok) {
    throw new Error('Failed to activate meet');
  }
}

// Export API
export async function exportMeetData(meetId?: string, clubId?: string): Promise<{ content: string; fileName: string }> {
  const response = await authenticatedFetch('/api/export', {
    method: 'POST',
    body: JSON.stringify({ meetId, clubId }),
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
  const response = await authenticatedFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch time records');
  }
  return response.json();
}

export async function createTimeRecord(record: Omit<TimeRecord, 'id' | 'createdAt' | 'isPersonalBest'>): Promise<TimeRecord> {
  const response = await authenticatedFetch('/api/times', {
    method: 'POST',
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error('Failed to create time record');
  }
  return response.json();
}

export async function updateTimeRecordApi(id: string, updates: Partial<TimeRecord>): Promise<void> {
  const response = await authenticatedFetch(`/api/times/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update time record');
  }
}

export async function deleteTimeRecordApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/times/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete time record');
  }
}

// Family API
export async function fetchAssociatedSwimmers(userId: string): Promise<Swimmer[]> {
  const response = await authenticatedFetch(`/api/swimmers?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch associated swimmers');
  }
  return response.json();
}

// Relay Teams API
export async function fetchRelayTeams(meetId?: string, clubId?: string): Promise<RelayTeam[]> {
  const params = new URLSearchParams();
  if (meetId) params.set('meetId', meetId);
  if (clubId) params.set('clubId', clubId);
  const url = `/api/relays${params.size ? `?${params}` : ''}`;
  const response = await authenticatedFetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch relay teams');
  }
  return response.json();
}

export async function createRelayTeam(team: Omit<RelayTeam, 'id'>): Promise<RelayTeam> {
  const response = await authenticatedFetch('/api/relays', {
    method: 'POST',
    body: JSON.stringify(team),
  });
  if (!response.ok) {
    throw new Error('Failed to create relay team');
  }
  return response.json();
}

export async function updateRelayTeamApi(id: string, updates: Partial<RelayTeam>): Promise<void> {
  const response = await authenticatedFetch(`/api/relays/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update relay team');
  }
}

export async function deleteRelayTeamApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/relays/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete relay team');
  }
}

// Swimmer Meet Events API
export async function fetchSwimmerMeetEvents(meetId: string, swimmerId?: string): Promise<SwimmerMeetEvent[]> {
  const response = await authenticatedFetch(`/api/swimmer-meet-events?swimmerId=${swimmerId?swimmerId:''}&meetId=${meetId}`);
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
  const response = await authenticatedFetch('/api/swimmer-meet-events', {
    method: 'POST',
    body: JSON.stringify({ swimmerId, meetId, eventSelections }),
  });
  if (!response.ok) {
    throw new Error('Failed to update swimmer meet events');
  }
}

// Events API
export async function fetchEvents(): Promise<SwimEvent[]> {
  const response = await authenticatedFetch('/api/events');
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

export async function fetchAllEvents(): Promise<SwimEvent[]> {
  const response = await authenticatedFetch('/api/admin/events');
  if (!response.ok) {
    throw new Error('Failed to fetch all events');
  }
  return response.json();
}

export async function seedEventsApi(): Promise<void> {
  const response = await authenticatedFetch('/api/admin/events/seed', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to seed events');
  }
}

// Clubs API
export async function fetchClubs(): Promise<SwimClub[]> {
  const response = await authenticatedFetch('/api/admin/clubs');
  if (!response.ok) {
    throw new Error('Failed to fetch clubs');
  }
  return response.json();
}

export async function fetchClub(clubId: string): Promise<SwimClub> {
  const response = await authenticatedFetch(`/api/admin/clubs/${clubId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch clubs');
  }
  return response.json();
}

export async function createClub(club: Partial<SwimClub>): Promise<SwimClub> {
  const response = await authenticatedFetch('/api/admin/clubs', {
    method: 'POST',
    body: JSON.stringify(club),
  });
  if (!response.ok) throw new Error('Failed to create club');
  return response.json();
}

export async function updateClubApi(id: string, updates: Partial<SwimClub>): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/clubs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update club');
}

export async function deleteClubApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/clubs/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete club');
}

// Leagues API
export async function fetchLeagues(): Promise<League[]> {
  const response = await authenticatedFetch('/api/admin/leagues');
  if (!response.ok) throw new Error('Failed to fetch leagues');
  return response.json();
}

export async function createLeague(data: Partial<League>): Promise<League> {
  const response = await authenticatedFetch('/api/admin/leagues', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create league');
  return response.json();
}

export async function updateLeagueApi(id: string, updates: Partial<League>): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/leagues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update league');
}

export async function deleteLeagueApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/leagues/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete league');
}

// Meet Templates API
export async function fetchMeetTemplates(): Promise<MeetTemplate[]> {
  const response = await authenticatedFetch('/api/admin/meet-templates');
  if (!response.ok) throw new Error('Failed to fetch meet templates');
  const data = await response.json();
  return data.map((t: any) => ({
    ...t,
    meetEvents: typeof t.meetEvents === 'string' ? JSON.parse(t.meetEvents) : t.meetEvents,
    availableEvents: typeof t.availableEvents === 'string' ? JSON.parse(t.availableEvents) : t.availableEvents,
  }));
}

export async function createMeetTemplate(data: Partial<MeetTemplate>): Promise<MeetTemplate> {
  const response = await authenticatedFetch('/api/admin/meet-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create meet template');
  return response.json();
}

export async function updateMeetTemplateApi(id: string, updates: Partial<MeetTemplate>): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/meet-templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update meet template');
}

export async function deleteMeetTemplateApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/meet-templates/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete meet template');
}

// Users API
export async function fetchUsers(clubId?: string): Promise<User[]> {
  const url = clubId ? `/api/admin/users?clubId=${clubId}` : '/api/admin/users';
  const response = await authenticatedFetch(url);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function createUserProfile(data: Partial<User>): Promise<User> {
  const response = await authenticatedFetch('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to create user');
  }
  return response.json();
}

export async function deleteUserProfileApi(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete user');
}

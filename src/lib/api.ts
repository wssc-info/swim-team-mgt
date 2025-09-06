import { Swimmer, Meet, RelayTeam } from './swimmers';

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

'use client';

import { useState, useEffect } from 'react';
import { fetchSwimmers, fetchMeets, createRelayTeam, fetchRelayTeams, updateRelayTeamApi, deleteRelayTeamApi, fetchAllEvents } from '@/lib/api';
import { SwimEvent } from '@/lib/types';
import RelayTeamForm from '@/components/RelayTeamForm';
import { useAuth } from '@/lib/auth-context';

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
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
  meetId: string;
  eventId: string;
  name: string;
  swimmers: string[];
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

export default function RelaysPage() {
  const { user } = useAuth();
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [activeMeet, setActiveMeet] = useState<Meet | null>(null);
  const [relayTeams, setRelayTeams] = useState<RelayTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<RelayTeam | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<SwimEvent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [swimmerData, meetData, eventsData] = await Promise.all([
          fetchSwimmers(),
          fetchMeets(),
          fetchAllEvents()
        ]);
        
        setSwimmers(swimmerData);
        setAllEvents(eventsData);
        
        // Filter meets to only show those for the user's club and find active meet
        const filteredMeets = user?.clubId 
          ? meetData.filter(meet => meet.clubId === user.clubId)
          : meetData;
        
        const active = filteredMeets.find(m => m.isActive) || null;
        setActiveMeet(active);
        
        // Load relay teams for the active meet
        if (active) {
          const relayData = await fetchRelayTeams(active.id);
          setRelayTeams(relayData);
        } else {
          setRelayTeams([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setShowForm(true);
  };

  const handleEditTeam = (team: RelayTeam) => {
    setSelectedTeam(team);
    setShowForm(true);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this relay team?')) {
      try {
        await deleteRelayTeamApi(teamId);
        setRelayTeams(relayTeams.filter(team => team.id !== teamId));
      } catch (error) {
        console.error('Error deleting relay team:', error);
        alert('Failed to delete relay team');
      }
    }
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setSelectedTeam(null);
    // Refresh relay teams for the active meet
    if (activeMeet) {
      try {
        const updatedTeams = await fetchRelayTeams(activeMeet.id);
        setRelayTeams(updatedTeams);
      } catch (error) {
        console.error('Error refreshing relay teams:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!activeMeet) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Relay Teams</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Active Meet</h2>
          <p className="text-yellow-700">
            There is currently no active meet available for relay team creation. 
            Please set up a meet first.
          </p>
        </div>
      </div>
    );
  }

  const availableEvents = activeMeet.availableEvents
    .map(eventId => allEvents.find(e => e.id === eventId))
    .filter(Boolean) as SwimEvent[];

  const relayEvents = availableEvents.filter(event => event.isRelay);

  const getSwimmerName = (swimmerId: string) => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown Swimmer';
  };

  const getEventName = (eventId: string) => {
    const event = allEvents.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Relay Teams</h1>
        <button
          onClick={handleCreateTeam}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={relayEvents.length === 0}
        >
          Create Relay Team
        </button>
      </div>

      {/* Active Meet Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          {activeMeet.name}
        </h2>
        <p className="text-green-700 mb-2">
          {new Date(activeMeet.date).toLocaleDateString()} • {activeMeet.location}
        </p>
        <p className="text-sm text-green-600">
          {relayEvents.length} relay events available
        </p>
      </div>

      {relayEvents.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Relay Events</h2>
          <p className="text-yellow-700">
            The active meet has no relay events available. Please add relay events to the meet first.
          </p>
        </div>
      )}

      {/* Relay Team Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <RelayTeamForm
              team={selectedTeam}
              swimmers={swimmers}
              availableEvents={relayEvents}
              meetId={activeMeet.id}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Relay Teams List */}
      {relayTeams.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Relay Teams</h2>
          <p className="text-gray-600 mb-4">
            No relay teams have been created yet.
          </p>
          {relayEvents.length > 0 && (
            <button
              onClick={handleCreateTeam}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Your First Relay Team
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            relayTeams.reduce((groups, team) => {
              const eventName = getEventName(team.eventId);
              const group = groups[eventName] || [];
              group.push(team);
              groups[eventName] = group;
              return groups;
            }, {} as Record<string, RelayTeam[]>)
          ).map(([eventName, eventTeams]) => (
            <div key={eventName} className="bg-white rounded-lg shadow">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="text-xl font-semibold">
                  {eventName} ({eventTeams.length} teams)
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {eventTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <p className="text-sm text-gray-600">
                              {team.ageGroup} • {team.gender}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Swimmers:</p>
                          <div className="flex flex-wrap gap-2">
                            {team.swimmers.map((swimmerId, index) => (
                              <span
                                key={swimmerId}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {index + 1}. {getSwimmerName(swimmerId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  fetchSwimmers,
  fetchMeets,
  createRelayTeam,
  fetchRelayTeams,
  updateRelayTeamApi,
  deleteRelayTeamApi,
  fetchAllEvents,
  fetchClub
} from '@/lib/api';
import {Meet, RelayTeam, SwimClub, SwimEvent, Swimmer} from '@/lib/types';
import RelayTeamForm from '@/components/RelayTeamForm';
import { useAuth } from '@/lib/auth-context';
import {getClubId} from "@/lib/utils";


export default function RelaysPage() {
  const { user } = useAuth();
  const [club, setClub] = useState<SwimClub>();
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
        const clubId = getClubId(user);
        const [swimmerData, meetData, eventsData, userClub] = await Promise.all([
          fetchSwimmers(clubId),
          fetchMeets(false, clubId),
          fetchAllEvents(),
          fetchClub(clubId)
        ]);
        
        setSwimmers(swimmerData);
        setAllEvents(eventsData);
        
        // Filter meets to only show those for the user's club and find active meet
        const filteredMeets = meetData;

        setClub(userClub);

        const active = filteredMeets.find(m => m.id == userClub?.activeMeetId) || null;
        setActiveMeet(active);
        
        // Load relay teams for the active meet, scoped to this club
        if (active) {
          const relayData = await fetchRelayTeams(active.id, clubId);
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
    // Refresh relay teams for the active meet, scoped to this club
    if (activeMeet) {
      try {
        let clubId: string | undefined;
        try { clubId = getClubId(user) ?? undefined; } catch { /* ignore */ }
        const updatedTeams = await fetchRelayTeams(activeMeet.id, clubId);
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

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Relay Teams</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Club Association</h2>
          <p className="text-yellow-700">
            You need to be associated with a club to manage relay teams. Please contact an administrator 
            to assign you to a club.
          </p>
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

  // Build meet-driven relay hierarchy: event → ageGroup → gender
  // Each level is driven by activeMeet.meetEvents so empty slots are always shown.
  const relayMeetEvents = activeMeet.meetEvents.filter(
    me => allEvents.find(e => e.id === me.eventId)?.isRelay
  );
  const relayMeetEventCount = relayMeetEvents.length;

  type GenderSlot = { gender: string; teams: RelayTeam[] };
  type AgeGroupSlot = { ageGroup: string; genders: GenderSlot[] };
  type EventSlot = { event: SwimEvent; ageGroups: AgeGroupSlot[] };

  const eventMap = new Map<string, Map<string, Set<string>>>();
  for (const me of relayMeetEvents) {
    if (!eventMap.has(me.eventId)) eventMap.set(me.eventId, new Map());
    const agMap = eventMap.get(me.eventId)!;
    if (!agMap.has(me.ageGroup)) agMap.set(me.ageGroup, new Set());
    agMap.get(me.ageGroup)!.add(me.gender);
  }

  const validCombos = new Set(
    relayMeetEvents.map(me => `${me.eventId}|${me.ageGroup}|${me.gender}`)
  );
  const invalidTeams = relayTeams.filter(
    t => !validCombos.has(`${t.eventId}|${t.ageGroup}|${t.gender}`)
  );

  const hierarchy: EventSlot[] = Array.from(eventMap.entries()).map(([eventId, agMap]) => ({
    event: allEvents.find(e => e.id === eventId)!,
    ageGroups: Array.from(agMap.entries()).map(([ageGroup, genders]) => ({
      ageGroup,
      genders: Array.from(genders).map(gender => ({
        gender,
        teams: relayTeams.filter(
          t => t.eventId === eventId && t.ageGroup === ageGroup && t.gender === gender
        ),
      })),
    })),
  }));

  const genderLabel = (g: string) => g === 'M' ? 'Boys' : g === 'F' ? 'Girls' : 'Mixed';

  const getSwimmerName = (swimmerId: string) => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown Swimmer';
  };

  const TeamCard = ({ team }: { team: RelayTeam }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold">{team.name}</h4>
          {team.seedTime && (
            <span className="text-sm text-gray-500">Seed: {team.seedTime}</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
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
  );

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
          {relayMeetEventCount} relay event/age-group/gender combinations available
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

      {/* Relay Teams — meet-driven hierarchy: Event → Age Group → Gender */}
      {relayMeetEventCount === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No relay event slots configured for this meet.</p>
          <button onClick={handleCreateTeam} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Create Your First Relay Team
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {hierarchy.map(({ event, ageGroups }) => (
            <div key={event.id} className="bg-white rounded-lg shadow">
              {/* Event header */}
              <div className="bg-gray-100 px-6 py-3 border-b">
                <h2 className="text-xl font-bold">{event.name}</h2>
              </div>

              <div className="p-4 space-y-4">
                {ageGroups.map(({ ageGroup, genders }) => (
                  <div key={ageGroup} className="border rounded-lg overflow-hidden">
                    {/* Age group header */}
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h3 className="font-semibold text-gray-800">{ageGroup}</h3>
                    </div>

                    <div className="divide-y">
                      {genders.map(({ gender, teams }) => (
                        <div key={gender} className="p-4">
                          {/* Gender header */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-700">
                              {genderLabel(gender)}
                              <span className="ml-2 text-sm font-normal text-gray-400">
                                ({teams.length} {teams.length === 1 ? 'team' : 'teams'})
                              </span>
                            </h4>
                          </div>

                          {teams.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No teams assigned yet</p>
                          ) : (
                            <div className="space-y-2">
                              {teams.map(team => <TeamCard key={team.id} team={team} />)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Invalid teams — don't match any meet event slot */}
          {invalidTeams.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-red-200">
              <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                <h2 className="text-xl font-bold text-red-800">Invalid Teams</h2>
                <p className="text-sm text-red-600 mt-1">
                  These teams don't match any event/age-group/gender slot in the active meet.
                </p>
              </div>
              <div className="p-4 space-y-2">
                {invalidTeams.map(team => (
                  <div key={team.id} className="border border-red-100 rounded-lg">
                    <div className="px-4 py-1 bg-red-50 text-xs text-red-500 rounded-t-lg">
                      {allEvents.find(e => e.id === team.eventId)?.name ?? 'Unknown event'} • {team.ageGroup} • {genderLabel(team.gender)}
                    </div>
                    <TeamCard team={team} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

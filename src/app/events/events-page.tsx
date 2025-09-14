'use client';

import { useState, useEffect } from 'react';
import { fetchSwimmers, fetchMeets, fetchAssociatedSwimmers, fetchSwimmerMeetEvents, fetchAllEvents } from '@/lib/api';
import { SwimEvent } from '@/lib/types';
import EventSelection from '@/components/EventSelection';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
}

interface SwimmerWithEvents extends Swimmer {
  selectedEvents?: string[];
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

export function EventsPage() {
  const { user } = useAuth();
  const [swimmers, setSwimmers] = useState<SwimmerWithEvents[]>([]);
  const [activeMeet, setActiveMeet] = useState<Meet | null>(null);
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<SwimEvent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meetData, eventsData] = await Promise.all([
          fetchMeets(),
          fetchAllEvents()
        ]);
        
        const active = meetData.find(m => m.isActive) || null;
        setActiveMeet(active);
        setAllEvents(eventsData);

        // Fetch swimmers based on user role
        let swimmerData: Swimmer[];
        if (user?.role === 'family' && user?.id) {
          // For family users, only fetch their associated swimmers
          swimmerData = await fetchAssociatedSwimmers(user.id);
        } else {
          // For coaches, fetch all swimmers
          swimmerData = await fetchSwimmers();
        }
        
        // If we have an active meet, load event selections for each swimmer
        if (active) {
          const swimmersWithEvents = await Promise.all(
            swimmerData.map(async (swimmer) => {
              try {
                const swimmerMeetEvents = await fetchSwimmerMeetEvents(swimmer.id, active.id);
                const selectedEvents = swimmerMeetEvents.map(sme => sme.eventId);
                return { ...swimmer, selectedEvents };
              } catch (error) {
                console.error(`Error loading events for swimmer ${swimmer.id}:`, error);
                return { ...swimmer, selectedEvents: [] };
              }
            })
          );
          setSwimmers(swimmersWithEvents);
        } else {
          // No active meet, so no selected events
          setSwimmers(swimmerData.map(swimmer => ({ ...swimmer, selectedEvents: [] })));
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

  const handleSwimmerSelect = (swimmer: Swimmer) => {
    setSelectedSwimmer(swimmer);
  };

  const handleEventSelectionClose = async () => {
    setSelectedSwimmer(null);
    // Refresh swimmers data to show updated selections
    if (!activeMeet) return;
    
    try {
      let swimmerData: Swimmer[];
      if (user?.role === 'family' && user?.id) {
        swimmerData = await fetchAssociatedSwimmers(user.id);
      } else {
        swimmerData = await fetchSwimmers();
      }
      
      // Load event selections for each swimmer
      const swimmersWithEvents = await Promise.all(
        swimmerData.map(async (swimmer) => {
          try {
            const swimmerMeetEvents = await fetchSwimmerMeetEvents(swimmer.id, activeMeet.id);
            const selectedEvents = swimmerMeetEvents.map(sme => sme.eventId);
            return { ...swimmer, selectedEvents };
          } catch (error) {
            console.error(`Error loading events for swimmer ${swimmer.id}:`, error);
            return { ...swimmer, selectedEvents: [] };
          }
        })
      );
      setSwimmers(swimmersWithEvents);
    } catch (error) {
      console.error('Error refreshing swimmers:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!activeMeet) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Active Meet</h2>
          <p className="text-yellow-700">
            There is currently no active meet available for event registration. 
            Please contact your coach to set up a meet.
          </p>
        </div>
      </div>
    );
  }

  if (swimmers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">No Swimmers Found</h2>
          <p className="text-blue-700">
            No swimmers have been added to the system yet. 
            Please contact your coach to add swimmers before registering for events.
          </p>
        </div>
      </div>
    );
  }

  const availableEvents = activeMeet.availableEvents
    .map(eventId => allEvents.find(e => e.id === eventId))
    .filter(Boolean) as SwimEvent[];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
      
      {/* Active Meet Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          {activeMeet.name}
        </h2>
        <p className="text-green-700 mb-2">
          {new Date(activeMeet.date).toLocaleDateString()} • {activeMeet.location}
        </p>
        <p className="text-sm text-green-600">
          {availableEvents.length} events available for registration
        </p>
      </div>

      {/* Event Selection Modal */}
      {selectedSwimmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <EventSelection
              swimmer={selectedSwimmer}
              availableEvents={availableEvents}
              onClose={handleEventSelectionClose}
            />
          </div>
        </div>
      )}

      {/* Swimmers List */}
      <div className="space-y-6">
        {Object.entries(
          swimmers.reduce((groups, swimmer) => {
            const group: SwimmerWithEvents[] = groups[swimmer.ageGroup] || [];
            group.push(swimmer);
            groups[swimmer.ageGroup] = group;
            return groups;
          }, {} as Record<string, SwimmerWithEvents[]>)
        )
          .sort(([a], [b]) => {
            const order = ['8&U', '9-10', '11-12', '13-14', '15-18'];
            return order.indexOf(a) - order.indexOf(b);
          })
          .map(([ageGroup, groupSwimmers]) => {
            // Filter events available for this age group
            const ageGroupEvents = availableEvents.filter(event => 
              event.ageGroups.includes(ageGroup)
            );

            if (ageGroupEvents.length === 0) {
              return null; // Skip age groups with no available events
            }

            return (
              <div key={ageGroup} className="bg-white rounded-lg shadow">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h2 className="text-xl font-semibold">
                    {ageGroup} ({groupSwimmers.length} swimmers)
                  </h2>
                  <p className="text-sm text-gray-600">
                    {ageGroupEvents.length} events available for this age group
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {groupSwimmers
                      .sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`))
                      .map((swimmer) => {
                        const eligibleEvents = ageGroupEvents.filter(event => 
                          event.ageGroups.includes(swimmer.ageGroup)
                        );
                        // const selectedCount = swimmer.selectedEvents.filter(eventId =>
                        //   activeMeet.availableEvents.includes(eventId)
                        // ).length;

                        return (
                          <div
                            key={swimmer.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <h3 className="font-semibold">
                                    {swimmer.firstName} {swimmer.lastName}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {swimmer.gender} • Born: {new Date(swimmer.dateOfBirth).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  Events: {swimmer.selectedEvents?.length || 0} selected
                                </p>
                                <p className="text-xs text-gray-500">
                                  {eligibleEvents.length} events available
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSwimmerSelect(swimmer)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                              >
                                Select Events
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })
          .filter(Boolean)}
      </div>
    </div>
  );
}

export default function ProtectedEventsPage() {
  return (
    <ProtectedRoute allowedRoles={['coach', 'family']}>
      <EventsPage />
    </ProtectedRoute>
  );
}

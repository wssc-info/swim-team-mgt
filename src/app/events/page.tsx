'use client';

import { useState, useEffect } from 'react';
import { Swimmer, Meet } from '@/lib/swimmers';
import { fetchSwimmers, fetchMeets, updateSwimmerApi } from '@/lib/api';
import { USA_SWIMMING_EVENTS, SwimEvent, getEventsByAgeGroup } from '@/lib/events';
import EventSelection from '@/components/EventSelection';

export default function EventsPage() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [activeMeet, setActiveMeet] = useState<Meet | null>(null);
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [swimmerData, meetData] = await Promise.all([
          fetchSwimmers(),
          fetchMeets()
        ]);
        
        setSwimmers(swimmerData);
        const active = meetData.find(m => m.isActive) || null;
        setActiveMeet(active);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSwimmerSelect = (swimmer: Swimmer) => {
    setSelectedSwimmer(swimmer);
  };

  const handleEventSelectionClose = async () => {
    setSelectedSwimmer(null);
    // Refresh swimmers data to show updated selections
    try {
      const updatedSwimmers = await fetchSwimmers();
      setSwimmers(updatedSwimmers);
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
    .map(eventId => USA_SWIMMING_EVENTS.find(e => e.id === eventId))
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
            const group = groups[swimmer.ageGroup] || [];
            group.push(swimmer);
            groups[swimmer.ageGroup] = group;
            return groups;
          }, {} as Record<string, Swimmer[]>)
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
                        const selectedCount = swimmer.selectedEvents.filter(eventId =>
                          activeMeet.availableEvents.includes(eventId)
                        ).length;

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
                                  Events: {selectedCount > 0 
                                    ? `${selectedCount} selected for this meet`
                                    : 'None selected'}
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

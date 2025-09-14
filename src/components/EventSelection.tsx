'use client';

import { useState, useEffect } from 'react';
import { SwimEvent } from '@/lib/types';
import { fetchSwimmerMeetEvents, updateSwimmerMeetEvents, fetchMeets } from '@/lib/api';

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

interface EventSelectionProps {
  swimmer: Swimmer;
  availableEvents: SwimEvent[];
  onClose: () => void;
}

export default function EventSelection({ swimmer, availableEvents, onClose }: EventSelectionProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [seedTimes, setSeedTimes] = useState<Record<string, string>>({});
  const [activeMeetId, setActiveMeetId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState({
    stroke: 'all',
    eventType: 'all', // individual, relay, all
    course: 'all' // SCY, SCM, LCM, all
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSwimmerData = async () => {
      setLoading(true);
      try {
        // Get the active meet
        const meets = await fetchMeets();
        const activeMeet = meets.find(m => m.isActive);
        
        if (!activeMeet) {
          console.error('No active meet found');
          setLoading(false);
          return;
        }
        
        setActiveMeetId(activeMeet.id);
        
        // Load swimmer's event selections for this meet
        const swimmerMeetEvents = await fetchSwimmerMeetEvents(swimmer.id, activeMeet.id);
        const eventIds = swimmerMeetEvents.map(sme => sme.eventId);
        const seedTimesMap = swimmerMeetEvents.reduce((acc, sme) => {
          if (sme.seedTime) {
            acc[sme.eventId] = sme.seedTime;
          }
          return acc;
        }, {} as Record<string, string>);
        
        setSelectedEvents(eventIds);
        
        // Load best times from API for events not already selected
        const response = await fetch(`/api/swimmers/${swimmer.id}/best-times`);
        if (response.ok) {
          const bestTimes = await response.json();
          // Merge best times with existing seed times, preferring existing seed times
          setSeedTimes({ ...bestTimes, ...seedTimesMap });
        } else {
          console.error('Failed to fetch best times');
          setSeedTimes(seedTimesMap);
        }
      } catch (error) {
        console.error('Error loading swimmer data:', error);
        setSeedTimes({});
      } finally {
        setLoading(false);
      }
    };

    loadSwimmerData();
  }, [swimmer]);

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };


  const handleSave = async () => {
    if (!activeMeetId) {
      alert('No active meet found. Cannot save event selections.');
      return;
    }

    setSaving(true);
    try {
      // Prepare event selections with seed times
      const eventSelections = selectedEvents.map(eventId => ({
        eventId,
        seedTime: seedTimes[eventId] || undefined
      }));

      await updateSwimmerMeetEvents(swimmer.id, activeMeetId, eventSelections);
      onClose();
    } catch (error) {
      console.error('Error saving event selections:', error);
      alert('Failed to save event selections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredEvents = (): SwimEvent[] => {
    return availableEvents.filter(event => {
      // Only show events for swimmer's age group
      if (!event.ageGroups.includes(swimmer.ageGroup)) {
        return false;
      }

      if (eventFilter.stroke !== 'all' && event.stroke !== eventFilter.stroke) {
        return false;
      }
      
      if (eventFilter.eventType === 'individual' && event.isRelay) {
        return false;
      }
      
      if (eventFilter.eventType === 'relay' && !event.isRelay) {
        return false;
      }
      
      if (eventFilter.course !== 'all' && event.course !== eventFilter.course) {
        return false;
      }
      
      return true;
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredEvents = getFilteredEvents();
    const allSelected = filteredEvents.every(event => selectedEvents.includes(event.id));
    
    if (allSelected) {
      // Deselect all filtered events
      setSelectedEvents(prev => prev.filter(id => 
        !filteredEvents.some(event => event.id === id)
      ));
    } else {
      // Select all filtered events
      const newEventIds = filteredEvents.map(event => event.id);
      setSelectedEvents(prev => [...new Set([...prev, ...newEventIds])]);
    }
  };

  const filteredEvents = getFilteredEvents();
  const allFilteredSelected = filteredEvents.length > 0 && 
    filteredEvents.every(event => selectedEvents.includes(event.id));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">
            Event Selection - {swimmer.firstName} {swimmer.lastName}
          </h2>
          <p className="text-sm text-gray-600">
            Age Group: {swimmer.ageGroup} • {selectedEvents.length} events selected
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Event Filters */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Events:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Course</label>
            <select
              value={eventFilter.course}
              onChange={(e) => setEventFilter(prev => ({ ...prev, course: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="all">All Courses</option>
              <option value="SCY">Short Course Yards</option>
              <option value="SCM">Short Course Meters</option>
              <option value="LCM">Long Course Meters</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Stroke</label>
            <select
              value={eventFilter.stroke}
              onChange={(e) => setEventFilter(prev => ({ ...prev, stroke: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="all">All Strokes</option>
              <option value="freestyle">Freestyle</option>
              <option value="backstroke">Backstroke</option>
              <option value="breaststroke">Breaststroke</option>
              <option value="butterfly">Butterfly</option>
              <option value="individual-medley">Individual Medley</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Event Type</label>
            <select
              value={eventFilter.eventType}
              onChange={(e) => setEventFilter(prev => ({ ...prev, eventType: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="all">All Events</option>
              <option value="individual">Individual Only</option>
              <option value="relay">Relay Only</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3">
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
          >
            {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'} ({filteredEvents.length})
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading swimmer data...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No events available for the selected filters and age group.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => {
              const isSelected = selectedEvents.includes(event.id);
              const seedTime = seedTimes[event.id];

              return (
                <div key={event.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleEventToggle(event.id)}
                      className="mt-1 rounded"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${event.isRelay ? 'text-purple-700' : 'text-gray-900'}`}>
                            {event.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {event.distance} {event.stroke.replace('-', ' ')} • {event.course}
                            {event.isRelay && ' • Relay Event'}
                          </p>
                        </div>
                        {!event.isRelay && (
                          <div className="ml-4">
                            <label className="block text-xs text-gray-600 mb-1">
                              Seed Time
                            </label>
                            <input
                              type="text"
                              value={seedTime || ''}
                              onChange={(e) => setSeedTimes(prev => ({
                                ...prev,
                                [event.id]: e.target.value
                              }))}
                              placeholder="MM:SS.ss or NT"
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                              disabled={!isSelected}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Event Selection'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tips:</strong> Select the events you want to swim in this meet. 
          Your best times from previous meets are automatically shown as seed times. 
          "NT" means No Time (no previous record for this event). 
          Relay events will be organized by your coach.
        </p>
      </div>
    </div>
  );
}

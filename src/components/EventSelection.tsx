'use client';

import { useState, useEffect } from 'react';
import {Meet, SwimEvent, SwimmerWithEvents} from '@/lib/types';
import Modal from '@/components/Modal';
import { fetchSwimmerMeetEvents, updateSwimmerMeetEvents, fetchMeets, authenticatedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

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

// Multiply these factors by the source time to get the target course time
const COURSE_FACTORS: Record<string, Record<string, number>> = {
  SCM: { SCY: 0.900, LCM: 1.030 },
  LCM: { SCY: 0.874, SCM: 0.971 },
  SCY: { SCM: 1.111, LCM: 1.145 },
};

function parseTimeToSeconds(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) return NaN;
  const mins = parseInt(parts[0], 10);
  const secs = parseFloat(parts[1]);
  return mins * 60 + secs;
}

function formatSeconds(total: number): string {
  const mins = Math.floor(total / 60);
  const secs = total - mins * 60;
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
}

function convertCourseTime(time: string, fromCourse: string, toCourse: string): string | null {
  if (fromCourse === toCourse) return time;
  const factor = COURSE_FACTORS[fromCourse]?.[toCourse];
  if (!factor) return null;
  const secs = parseTimeToSeconds(time);
  if (isNaN(secs)) return null;
  return formatSeconds(secs * factor);
}

interface EventSelectionProps {
  swimmer: SwimmerWithEvents;
  meet: Meet;
  availableEvents: SwimEvent[];
  allEvents?: SwimEvent[];
  maxEventsPerSwimmer?: number;
  onClose: () => void;
}

export default function EventSelection({ swimmer, meet, availableEvents, allEvents, maxEventsPerSwimmer, onClose }: EventSelectionProps) {
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
  const [convertedEventIds, setConvertedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadSwimmerData = async () => {
      setLoading(true);
      try {
        setActiveMeetId(meet.id);
        
        // Load swimmer's event selections for this meet
        const swimmerMeetEvents = swimmer.selectedEvents || [];//await fetchSwimmerMeetEvents(swimmer.id, meet.id);
        const eventIds = swimmerMeetEvents.map(sme => sme.eventId);
        const seedTimesMap = swimmerMeetEvents.reduce((acc, sme) => {
          if (sme.seedTime) {
            acc[sme.eventId] = sme.seedTime;
          }
          return acc;
        }, {} as Record<string, string>);
        
        setSelectedEvents(eventIds);
        
        // Load best times from API for events not already selected
        const response = await authenticatedFetch(`/api/swimmers/${swimmer.id}/best-times`);

        if (response.ok) {
          const bestTimes = await response.json();
          const merged: Record<string, string> = { ...bestTimes, ...seedTimesMap };

          // For each available event that has no direct time, look for a cross-course equivalent
          const converted = new Set<string>();
          if (allEvents) {
            for (const availEvent of availableEvents) {
              if (merged[availEvent.id]) continue;
              for (const [eventId, time] of Object.entries(merged)) {
                const src = allEvents.find(e => e.id === eventId);
                if (!src) continue;
                if (src.distance !== availEvent.distance) continue;
                if (src.stroke !== availEvent.stroke) continue;
                if (src.isRelay !== availEvent.isRelay) continue;
                if (src.course === availEvent.course) continue;
                const convertedTime = convertCourseTime(time, src.course, availEvent.course);
                if (convertedTime) {
                  merged[availEvent.id] = convertedTime;
                  converted.add(availEvent.id);
                }
                break;
              }
            }
          }

          setSeedTimes(merged);
          setConvertedEventIds(converted);
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
  }, [meet.id, swimmer]);

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

  const title = (
    <div>
      <div>Event Selection — {swimmer.firstName} {swimmer.lastName}</div>
      <p className="text-sm font-normal text-gray-600 mt-0.5">
        Age Group: {swimmer.ageGroup} •{' '}
        {maxEventsPerSwimmer && maxEventsPerSwimmer > 0
          ? <span className={selectedEvents.length >= maxEventsPerSwimmer ? 'text-orange-600 font-medium' : ''}>
              {selectedEvents.length} of {maxEventsPerSwimmer} events selected
              {selectedEvents.length >= maxEventsPerSwimmer && ' (limit reached)'}
            </span>
          : `${selectedEvents.length} events selected`
        }
      </p>
    </div>
  );

  const footer = (
    <div className="space-y-3">
      <div className="flex space-x-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Event Selection'}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
          Cancel
        </Button>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tips:</strong> Select the events you want to swim in this meet.
          Your best times from previous meets are automatically shown as seed times.
          "NT" means No Time (no previous record for this event).
          Relay events will be organized by your coach.
        </p>
      </div>
    </div>
  );

  return (
    <Modal title={title} onClose={onClose} footer={footer} size="4xl">
      <div className="space-y-4">
      {/* Event Filters */}
      <div className="p-4 bg-gray-50 rounded-lg">
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
          <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllFiltered} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'} ({filteredEvents.length})
          </Button>
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

              const isDisabled = loading || (!isSelected && !!maxEventsPerSwimmer && maxEventsPerSwimmer > 0 && selectedEvents.length >= maxEventsPerSwimmer);

              return (
                <div
                  key={event.id}
                  onClick={() => !isDisabled && handleEventToggle(event.id)}
                  className={`p-4 flex items-center space-x-4 transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'} ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-400 bg-white'}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
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
                      <div className="ml-4 text-right" onClick={e => e.stopPropagation()}>
                        <label className="block text-xs text-gray-600 mb-1">
                          Seed Time
                          {convertedEventIds.has(event.id) && (
                            <span className="ml-1 text-orange-500 font-medium" title={`Converted from ${(() => { const src = allEvents?.find(e => Object.keys(seedTimes ?? {}).includes(e.id) && e.distance === event.distance && e.stroke === event.stroke && e.course !== event.course); return src?.course ?? ''; })()}`}>
                              (conv.)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={seedTime || 'NT'}
                          onChange={(e) => setSeedTimes(prev => ({
                            ...prev,
                            [event.id]: e.target.value
                          }))}
                          placeholder="MM:SS.ss or NT"
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                          disabled={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </Modal>
  );
}

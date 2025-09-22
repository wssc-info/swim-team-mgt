'use client';

import { useState, useEffect } from 'react';
import { createMeet, updateMeetApi, fetchAllEvents, fetchClubs } from '@/lib/api';
import { SwimEvent, SwimClub } from "@/lib/types";
import { useAuth } from '@/lib/auth-context';
import { DataTable } from "@/components/datatable/dataTable";
import { ColumnDef } from "@tanstack/react-table";

interface MeetEvent {
  eventId: string;
  eventNumber: number;
  ageGroup: string;
}

interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  course: 'SCY' | 'SCM' | 'LCM';
  availableEvents: string[];
  meetEvents: MeetEvent[];
  isActive: boolean;
  clubId: string;
  againstClubId?: string;
  createdAt: string;
}

interface MeetFormProps {
  meet?: Meet | null;
  onClose: () => void;
}

export default function MeetForm({ meet, onClose }: MeetFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    course: 'SCY' as 'SCY' | 'SCM' | 'LCM',
    availableEvents: [] as string[],
    meetEvents: [] as MeetEvent[],
    isActive: false,
    clubId: '',
    againstClubId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eventFilter, setEventFilter] = useState({
    stroke: 'all',
    ageGroup: 'all',
    eventType: 'all', // individual, relay, all
    course: 'all' // SCY, SCM, LCM, all
  });
  const [allEvents, setAllEvents] = useState<SwimEvent[]>([]);
  const [allClubs, setAllClubs] = useState<SwimClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [events, clubs] = await Promise.all([
          fetchAllEvents(),
          fetchClubs()
        ]);
        setAllEvents(events);
        setAllClubs(clubs);
        
        // If user is not admin, set their club as default
        if (user && user.role !== 'admin' && user.clubId) {
          setFormData(prev => ({
            ...prev,
            clubId: user.clubId!
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (meet) {
      setFormData({
        name: meet.name,
        date: meet.date,
        location: meet.location,
        course: meet.course,
        availableEvents: meet.availableEvents || [],
        meetEvents: meet.meetEvents || [],
        isActive: meet.isActive,
        clubId: meet.clubId,
        againstClubId: meet.againstClubId || ''
      });
    }
  }, [meet]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Meet name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Meet date is required';
    } else {
      const meetDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (meetDate < today) {
        newErrors.date = 'Meet date cannot be in the past';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Meet location is required';
    }

    if (formData.meetEvents.length === 0) {
      newErrors.availableEvents = 'At least one event must be added';
    }

    if (!formData.clubId) {
      newErrors.clubId = 'Club is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (meet) {
        await updateMeetApi(meet.id, formData);
      } else {
        await createMeet(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving meet:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addMeetEvent = (eventId: string, ageGroup: string) => {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    const nextEventNumber = Math.max(0, ...formData.meetEvents.map(me => me.eventNumber)) + 1;
    
    const newMeetEvent: MeetEvent = {
      eventId,
      eventNumber: nextEventNumber,
      ageGroup
    };

    setFormData(prev => ({
      ...prev,
      meetEvents: [...prev.meetEvents, newMeetEvent],
      availableEvents: [...new Set([...prev.availableEvents, eventId])] // Keep for backward compatibility
    }));

    // Clear error when events are added
    if (errors.availableEvents) {
      setErrors(prev => ({
        ...prev,
        availableEvents: ''
      }));
    }
  };

  const removeMeetEvent = (eventId: string, ageGroup: string) => {
    setFormData(prev => {
      const newMeetEvents = prev.meetEvents.filter(me => !(me.eventId === eventId && me.ageGroup === ageGroup));
      // Only remove from availableEvents if no other age groups use this event
      const stillUsed = newMeetEvents.some(me => me.eventId === eventId);
      const newAvailableEvents = stillUsed ? prev.availableEvents : prev.availableEvents.filter(id => id !== eventId);
      
      return {
        ...prev,
        meetEvents: newMeetEvents,
        availableEvents: newAvailableEvents
      };
    });
  };

  const updateMeetEventNumber = (eventId: string, ageGroup: string, eventNumber: number) => {
    setFormData(prev => ({
      ...prev,
      meetEvents: prev.meetEvents.map(me => 
        me.eventId === eventId && me.ageGroup === ageGroup ? { ...me, eventNumber } : me
      )
    }));
  };

  const getFilteredEvents = (): SwimEvent[] => {
    return allEvents.filter(event => {
      // First filter by meet course type - this is mandatory
      if (event.course !== formData.course) {
        return false;
      }
      
      if (eventFilter.stroke !== 'all' && event.stroke !== eventFilter.stroke) {
        return false;
      }
      
      if (eventFilter.ageGroup !== 'all' && !event.ageGroups.includes(eventFilter.ageGroup)) {
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

  const filteredEvents = getFilteredEvents();
  
  // Get events that can still be added (have age groups not yet used)
  const getAvailableEventAgeGroups = (event: SwimEvent) => {
    const usedAgeGroups = formData.meetEvents
      .filter(me => me.eventId === event.id)
      .map(me => me.ageGroup);
    return event.ageGroups.filter(ag => !usedAgeGroups.includes(ag));
  };

  // Create columns for the meet events data table
  const meetEventColumns: ColumnDef<MeetEvent & { eventName: string; eventDetails: string }>[] = [
    {
      accessorKey: "eventNumber",
      header: "Event #",
      cell: ({ row }) => {
        const meetEvent = formData.meetEvents.find(me => 
          me.eventId === row.original.eventId && me.ageGroup === row.original.ageGroup
        );
        return (
          <input
            type="number"
            min="1"
            value={meetEvent?.eventNumber || 1}
            onChange={(e) => updateMeetEventNumber(row.original.eventId, row.original.ageGroup, parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
          />
        );
      },
    },
    {
      accessorKey: "eventName",
      header: "Event",
      cell: ({ row }) => (
        <div>
          <span className={`font-medium ${row.original.eventName.includes('Relay') ? 'text-purple-700' : ''}`}>
            {row.original.eventName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "ageGroup",
      header: "Age Group",
    },
    {
      accessorKey: "eventDetails",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {row.original.eventDetails}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => removeMeetEvent(row.original.eventId, row.original.ageGroup)}
          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
        >
          Remove
        </button>
      ),
    },
  ];

  // Prepare data for the meet events table
  const meetEventTableData = formData.meetEvents.map(meetEvent => {
    const event = allEvents.find(e => e.id === meetEvent.eventId);
    return {
      ...meetEvent,
      eventName: event?.name || 'Unknown Event',
      eventDetails: event ? `${event.course} • ${event.distance}m ${event.stroke}` : 'Unknown'
    };
  }).sort((a, b) => a.eventNumber - b.eventNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {meet ? 'Edit Meet' : 'Create New Meet'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Meet Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Spring Championship Meet"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Meet Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., City Aquatic Center"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
            Course Type *
          </label>
          <select
            id="course"
            name="course"
            value={formData.course}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SCY">Short Course Yards (SCY)</option>
            <option value="SCM">Short Course Meters (SCM)</option>
            <option value="LCM">Long Course Meters (LCM)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Only events matching this course type will be available for selection
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clubId" className="block text-sm font-medium text-gray-700 mb-1">
              Club (Meet For) *
            </label>
            <select
              id="clubId"
              name="clubId"
              value={formData.clubId}
              onChange={handleInputChange}
              disabled={user?.role !== 'admin'}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.clubId ? 'border-red-500' : 'border-gray-300'
              } ${user?.role !== 'admin' ? 'bg-gray-100' : ''}`}
            >
              <option value="">Select a club</option>
              {allClubs
                .filter(club => user?.role === 'admin' || club.id === user?.clubId)
                .map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} ({club.abbreviation})
                </option>
              ))}
            </select>
            {errors.clubId && (
              <p className="text-red-500 text-sm mt-1">{errors.clubId}</p>
            )}
            {user?.role !== 'admin' && (
              <p className="text-xs text-gray-500 mt-1">
                Non-admin users can only create meets for their own club
              </p>
            )}
          </div>

          <div>
            <label htmlFor="againstClubId" className="block text-sm font-medium text-gray-700 mb-1">
              Against Club (Optional)
            </label>
            <select
              id="againstClubId"
              name="againstClubId"
              value={formData.againstClubId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No opposing club</option>
              {allClubs
                .filter(club => club.id !== formData.clubId)
                .map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} ({club.abbreviation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Set as active meet (swimmers can register for this meet)
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Meet Events * ({formData.meetEvents.length} events added)
          </label>
          
          {/* Current Meet Events */}
          {formData.meetEvents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Events:</h4>
              <div className="border rounded-lg">
                <DataTable 
                  columns={meetEventColumns} 
                  data={meetEventTableData}

                />
              </div>
            </div>
          )}

          {/* Add New Events */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Add Events (showing only {formData.course} events):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
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
                  <option value="medley">Individual Medley</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Age Group</label>
                <select
                  value={eventFilter.ageGroup}
                  onChange={(e) => setEventFilter(prev => ({ ...prev, ageGroup: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="all">All Age Groups</option>
                  <option value="8&U">8 & Under</option>
                  <option value="9-10">9-10</option>
                  <option value="11-12">11-12</option>
                  <option value="13-14">13-14</option>
                  <option value="15-18">15-18</option>
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

            {/* Available Events to Add */}
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
              <div className="text-xs text-gray-600 mb-2">
                Available to add (by age group):
              </div>
              <div className="grid grid-cols-1 gap-2">
                {filteredEvents.map((event) => {
                  const availableAgeGroups = getAvailableEventAgeGroups(event);
                  if (availableAgeGroups.length === 0) return null;
                  
                  return (
                    <div key={event.id} className="border border-gray-100 rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${event.isRelay ? 'text-purple-700' : ''}`}>
                            {event.name}
                          </span>
                          <div className="text-xs text-gray-500">
                            {event.course} • {event.distance}m {event.stroke}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {availableAgeGroups.map((ageGroup) => (
                          <button
                            key={ageGroup}
                            type="button"
                            onClick={() => addMeetEvent(event.id, ageGroup)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Add {ageGroup}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {filteredEvents.every(event => getAvailableEventAgeGroups(event).length === 0) && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No more events/age groups available to add with current filters
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {errors.availableEvents && (
            <p className="text-red-500 text-sm mt-1">{errors.availableEvents}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {meet ? 'Update Meet' : 'Create Meet'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

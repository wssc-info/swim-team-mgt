'use client';

import { useState, useEffect } from 'react';
import { createMeet, updateMeetApi } from '@/lib/api';
import { USA_SWIMMING_EVENTS, SwimEvent } from '@/lib/events';

interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  availableEvents: string[];
  isActive: boolean;
  createdAt: string;
}

interface MeetFormProps {
  meet?: Meet | null;
  onClose: () => void;
}

export default function MeetForm({ meet, onClose }: MeetFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    availableEvents: [] as string[],
    isActive: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eventFilter, setEventFilter] = useState({
    stroke: 'all',
    ageGroup: 'all',
    eventType: 'all', // individual, relay, all
    course: 'all' // SCY, SCM, LCM, all
  });

  useEffect(() => {
    if (meet) {
      setFormData({
        name: meet.name,
        date: meet.date,
        location: meet.location,
        availableEvents: meet.availableEvents,
        isActive: meet.isActive
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

    if (formData.availableEvents.length === 0) {
      newErrors.availableEvents = 'At least one event must be selected';
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

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      availableEvents: prev.availableEvents.includes(eventId)
        ? prev.availableEvents.filter(id => id !== eventId)
        : [...prev.availableEvents, eventId]
    }));

    // Clear error when events are selected
    if (errors.availableEvents) {
      setErrors(prev => ({
        ...prev,
        availableEvents: ''
      }));
    }
  };

  const handleSelectAllEvents = () => {
    const filteredEvents = getFilteredEvents();
    const allSelected = filteredEvents.every(event => formData.availableEvents.includes(event.id));
    
    if (allSelected) {
      // Deselect all filtered events
      setFormData(prev => ({
        ...prev,
        availableEvents: prev.availableEvents.filter(id => 
          !filteredEvents.some(event => event.id === id)
        )
      }));
    } else {
      // Select all filtered events
      const newEventIds = filteredEvents.map(event => event.id);
      setFormData(prev => ({
        ...prev,
        availableEvents: [...new Set([...prev.availableEvents, ...newEventIds])]
      }));
    }
  };

  const getFilteredEvents = (): SwimEvent[] => {
    return USA_SWIMMING_EVENTS.filter(event => {
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
  const allFilteredSelected = filteredEvents.length > 0 && 
    filteredEvents.every(event => formData.availableEvents.includes(event.id));

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
            Available Events * ({formData.availableEvents.length} selected)
          </label>
          
          {/* Event Filters */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Events:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            
            <div className="mt-3">
              <button
                type="button"
                onClick={handleSelectAllEvents}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'} ({filteredEvents.length})
              </button>
            </div>
          </div>

          {/* Events List */}
          <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredEvents.map((event) => (
                <label key={event.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.availableEvents.includes(event.id)}
                    onChange={() => handleEventToggle(event.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <span className={event.isRelay ? 'text-purple-700 font-medium' : ''}>
                      {event.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      {event.course} • ({event.ageGroups.join(', ')})
                    </div>
                  </div>
                </label>
              ))}
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

'use client';

import { useState, useEffect } from 'react';
import { SwimEvent } from '@/lib/types';

interface EventFormProps {
  event?: SwimEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STROKES = [
  { value: 'freestyle', label: 'Freestyle' },
  { value: 'backstroke', label: 'Backstroke' },
  { value: 'breaststroke', label: 'Breaststroke' },
  { value: 'butterfly', label: 'Butterfly' },
  { value: 'individual-medley', label: 'Individual Medley' }
];

const COURSES = [
  { value: 'SCY', label: 'Short Course Yards (SCY)' },
  { value: 'SCM', label: 'Short Course Meters (SCM)' },
  { value: 'LCM', label: 'Long Course Meters (LCM)' }
];

const AGE_GROUPS = ['8&U', '9-10', '11-12', '13-14', '15-18'];

export default function EventForm({ event, onClose, onSuccess }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    distance: '',
    stroke: 'freestyle',
    course: 'SCY',
    isRelay: false,
    ageGroups: [] as string[],
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        distance: event.distance.toString(),
        stroke: event.stroke,
        course: event.course,
        isRelay: event.isRelay,
        ageGroups: event.ageGroups,
        isActive: event.isActive
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = event 
        ? `/api/admin/events/${event.id}`
        : '/api/admin/events';
      
      const method = event ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...formData,
          distance: parseInt(formData.distance)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeGroupToggle = (ageGroup: string) => {
    setFormData(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(ageGroup)
        ? prev.ageGroups.filter(ag => ag !== ageGroup)
        : [...prev.ageGroups, ageGroup]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {event ? 'Edit Event' : 'Add New Event'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Distance
          </label>
          <input
            type="number"
            value={formData.distance}
            onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stroke
          </label>
          <select
            value={formData.stroke}
            onChange={(e) => setFormData(prev => ({ ...prev, stroke: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {STROKES.map(stroke => (
              <option key={stroke.value} value={stroke.value}>
                {stroke.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={formData.course}
            onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {COURSES.map(course => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isRelay}
              onChange={(e) => setFormData(prev => ({ ...prev, isRelay: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Relay Event</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Groups
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AGE_GROUPS.map(ageGroup => (
              <label key={ageGroup} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.ageGroups.includes(ageGroup)}
                  onChange={() => handleAgeGroupToggle(ageGroup)}
                  className="rounded"
                />
                <span className="text-sm">{ageGroup}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

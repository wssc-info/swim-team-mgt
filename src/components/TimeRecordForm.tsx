'use client';

import { useState, useEffect } from 'react';
import { createTimeRecord, updateTimeRecordApi } from '@/lib/api';
import { USA_SWIMMING_EVENTS } from '@/lib/events';
import { Swimmer, TimeRecord } from '@/lib/types';

interface TimeRecordFormProps {
  record?: TimeRecord | null;
  swimmers: Swimmer[];
  onClose: () => void;
}

export default function TimeRecordForm({ record, swimmers, onClose }: TimeRecordFormProps) {
  const [formData, setFormData] = useState({
    swimmerId: '',
    eventId: '',
    time: '',
    meetName: '',
    meetDate: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({
        swimmerId: record.swimmerId,
        eventId: record.eventId,
        time: record.time,
        meetName: record.meetName,
        meetDate: record.meetDate
      });
    }
  }, [record]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.swimmerId) {
      newErrors.swimmerId = 'Swimmer is required';
    }

    if (!formData.eventId) {
      newErrors.eventId = 'Event is required';
    }

    if (!formData.time.trim()) {
      newErrors.time = 'Time is required';
    } else {
      // Validate time format (MM:SS.ss or SS.ss)
      const timeRegex = /^(\d{1,2}:)?\d{1,2}\.\d{2}$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time = 'Time must be in format MM:SS.ss or SS.ss';
      }
    }

    if (!formData.meetName.trim()) {
      newErrors.meetName = 'Meet name is required';
    }

    if (!formData.meetDate) {
      newErrors.meetDate = 'Meet date is required';
    } else {
      const meetDate = new Date(formData.meetDate);
      const today = new Date();
      if (meetDate > today) {
        newErrors.meetDate = 'Meet date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (record) {
        await updateTimeRecordApi(record.id, formData);
      } else {
        await createTimeRecord(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving time record:', error);
      alert('Failed to save time record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const selectedSwimmer = swimmers.find(s => s.id === formData.swimmerId);
  const availableEvents = selectedSwimmer 
    ? USA_SWIMMING_EVENTS.filter(event => event.ageGroups.includes(selectedSwimmer.ageGroup))
    : USA_SWIMMING_EVENTS;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {record ? 'Edit Time Record' : 'Add Time Record'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="swimmerId" className="block text-sm font-medium text-gray-700 mb-1">
            Swimmer *
          </label>
          <select
            id="swimmerId"
            name="swimmerId"
            value={formData.swimmerId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.swimmerId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a swimmer</option>
            {swimmers
              .sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`))
              .map(swimmer => (
                <option key={swimmer.id} value={swimmer.id}>
                  {swimmer.lastName}, {swimmer.firstName} ({swimmer.ageGroup})
                </option>
              ))}
          </select>
          {errors.swimmerId && (
            <p className="text-red-500 text-sm mt-1">{errors.swimmerId}</p>
          )}
        </div>

        <div>
          <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
            Event *
          </label>
          <select
            id="eventId"
            name="eventId"
            value={formData.eventId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.eventId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!formData.swimmerId}
          >
            <option value="">Select an event</option>
            {availableEvents.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.course})
              </option>
            ))}
          </select>
          {errors.eventId && (
            <p className="text-red-500 text-sm mt-1">{errors.eventId}</p>
          )}
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Time * (MM:SS.ss or SS.ss)
          </label>
          <input
            type="text"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.time ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 1:23.45 or 23.45"
          />
          {errors.time && (
            <p className="text-red-500 text-sm mt-1">{errors.time}</p>
          )}
        </div>

        <div>
          <label htmlFor="meetName" className="block text-sm font-medium text-gray-700 mb-1">
            Meet Name *
          </label>
          <input
            type="text"
            id="meetName"
            name="meetName"
            value={formData.meetName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.meetName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Spring Championship"
          />
          {errors.meetName && (
            <p className="text-red-500 text-sm mt-1">{errors.meetName}</p>
          )}
        </div>

        <div>
          <label htmlFor="meetDate" className="block text-sm font-medium text-gray-700 mb-1">
            Meet Date *
          </label>
          <input
            type="date"
            id="meetDate"
            name="meetDate"
            value={formData.meetDate}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.meetDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.meetDate && (
            <p className="text-red-500 text-sm mt-1">{errors.meetDate}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (record ? 'Update Record' : 'Add Record')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

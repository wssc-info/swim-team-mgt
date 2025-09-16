'use client';

import { useState, useEffect } from 'react';
import { SwimEvent } from '@/lib/types';
import EventForm from '@/components/EventForm';
import { authenticatedFetch, seedEventsApi } from "@/lib/api";
import {DataTable} from "@/app/admin/swimmers/dataTable";
import {getColumns} from "@/app/admin/events/columns";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<SwimEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SwimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SwimEvent | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [filters, setFilters] = useState({
    course: '',
    type: '',
    stroke: ''
  });

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/events');

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (filters.course) {
      filtered = filtered.filter(event => event.course === filters.course);
    }

    if (filters.type) {
      if (filters.type === 'individual') {
        filtered = filtered.filter(event => !event.isRelay);
      } else if (filters.type === 'relay') {
        filtered = filtered.filter(event => event.isRelay);
      }
    }

    if (filters.stroke) {
      filtered = filtered.filter(event => event.stroke === filters.stroke);
    }

    setFilteredEvents(filtered);
  }, [events, filters]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      course: '',
      type: '',
      stroke: ''
    });
  };

  const handleEdit = (event: SwimEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleFormSuccess = () => {
    fetchEvents();
  };

  const handleSeedEvents = async () => {
    setSeeding(true);
    try {
      await seedEventsApi();
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed events');
    } finally {
      setSeeding(false);
    }
  };

  const getStrokeColor = (stroke: string) => {
    const colors = {
      'freestyle': 'bg-blue-100 text-blue-800',
      'backstroke': 'bg-green-100 text-green-800',
      'breaststroke': 'bg-yellow-100 text-yellow-800',
      'butterfly': 'bg-purple-100 text-purple-800',
      'individual-medley': 'bg-red-100 text-red-800'
    };
    return colors[stroke as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  const createFilters = (table: any) => {
    return (
      <div className="flex space-x-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={(table.getColumn("course")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("course")?.setFilterValue(event.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            <option value="SCY">Short Course Yards (SCY)</option>
            <option value="SCM">Short Course Meters (SCM)</option>
            <option value="LCM">Long Course Meters (LCM)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={(table.getColumn("isRelay")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              let convertedValue: string | boolean = event.target.value;
              if (convertedValue === 'true') {
                convertedValue = true;
              } else if (convertedValue === 'false') {
                convertedValue = false;
              }
              table.getColumn("isRelay")?.setFilterValue(convertedValue)
            }
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="false">Individual</option>
            <option value="true">Relay</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stroke
          </label>
          <select
            value={(table.getColumn("stroke")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("stroke")?.setFilterValue(event.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Strokes</option>
            <option value="freestyle">Freestyle</option>
            <option value="backstroke">Backstroke</option>
            <option value="breaststroke">Breaststroke</option>
            <option value="butterfly">Butterfly</option>
            <option value="individual-medley">Individual Medley</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Event Administration</h1>
        <div className="space-x-4">
          {events.length === 0 && (
            <button
              onClick={handleSeedEvents}
              disabled={seeding}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed Default Events'}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New Event
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <EventForm
              event={editingEvent}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}

      <DataTable columns={getColumns(handleEdit, handleDelete)} data={events} />

      <div>
        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No events found</div>
            <p className="text-gray-400 mb-4">
              Get started by adding events or seeding with default USA Swimming events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

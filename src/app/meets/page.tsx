'use client';

import { useState, useEffect } from 'react';
import { Meet, getMeets, deleteMeet, setActiveMeet } from '@/lib/swimmers';
import { USA_SWIMMING_EVENTS } from '@/lib/events';
import MeetForm from '@/components/MeetForm';

export default function MeetsPage() {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeet, setEditingMeet] = useState<Meet | null>(null);

  useEffect(() => {
    const loadMeets = async () => {
      const meetData = await getMeets();
      setMeets(meetData);
    };
    loadMeets();
  }, []);

  const handleAddMeet = () => {
    setEditingMeet(null);
    setShowForm(true);
  };

  const handleEditMeet = (meet: Meet) => {
    setEditingMeet(meet);
    setShowForm(true);
  };

  const handleDeleteMeet = async (id: string) => {
    if (confirm('Are you sure you want to delete this meet?')) {
      await deleteMeet(id);
      const updatedMeets = await getMeets();
      setMeets(updatedMeets);
    }
  };

  const handleSetActive = async (id: string) => {
    await setActiveMeet(id);
    const updatedMeets = await getMeets();
    setMeets(updatedMeets);
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setEditingMeet(null);
    const updatedMeets = await getMeets();
    setMeets(updatedMeets);
  };

  const activeMeet = meets.find(m => m.isActive);
  const upcomingMeets = meets.filter(m => !m.isActive).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Meets</h1>
        <button
          onClick={handleAddMeet}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Meet
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <MeetForm
              meet={editingMeet}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Active Meet Section */}
      {activeMeet && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Active Meet</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-green-800">{activeMeet.name}</h3>
                <p className="text-green-700 mt-1">
                  {new Date(activeMeet.date).toLocaleDateString()} • {activeMeet.location}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {activeMeet.availableEvents.length} events available for swimmer registration
                </p>
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-green-700 hover:text-green-800">
                      View Available Events ({activeMeet.availableEvents.length})
                    </summary>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {activeMeet.availableEvents.map(eventId => {
                        const event = USA_SWIMMING_EVENTS.find(e => e.id === eventId);
                        return event ? (
                          <span key={eventId} className="text-xs bg-green-100 px-2 py-1 rounded">
                            {event.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </details>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEditMeet(activeMeet)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meets Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          {activeMeet ? 'Upcoming Meets' : 'All Meets'}
        </h2>
        
        {meets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No meets created yet.</p>
            <button
              onClick={handleAddMeet}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Create Your First Meet
            </button>
          </div>
        ) : upcomingMeets.length === 0 && activeMeet ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No upcoming meets scheduled.</p>
            <button
              onClick={handleAddMeet}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create New Meet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingMeets.map((meet) => (
              <div
                key={meet.id}
                className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{meet.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {new Date(meet.date).toLocaleDateString()} • {meet.location}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {meet.availableEvents.length} events available
                    </p>
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          View Available Events ({meet.availableEvents.length})
                        </summary>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {meet.availableEvents.map(eventId => {
                            const event = USA_SWIMMING_EVENTS.find(e => e.id === eventId);
                            return event ? (
                              <span key={eventId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {event.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </details>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleSetActive(meet.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      title="Set as active meet for swimmer registration"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleEditMeet(meet)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMeet(meet.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!activeMeet && meets.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> No active meet is set. Swimmers won't be able to register for events until you set a meet as active.
          </p>
        </div>
      )}
    </div>
  );
}

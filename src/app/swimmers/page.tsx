'use client';

import { useState, useEffect } from 'react';
import { Swimmer, getSwimmers, deleteSwimmer } from '@/lib/swimmers';
import SwimmerForm from '@/components/SwimmerForm';

export default function SwimmersPage() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSwimmer, setEditingSwimmer] = useState<Swimmer | null>(null);

  useEffect(() => {
    setSwimmers(getSwimmers());
  }, []);

  const handleAddSwimmer = () => {
    setEditingSwimmer(null);
    setShowForm(true);
  };

  const handleEditSwimmer = (swimmer: Swimmer) => {
    setEditingSwimmer(swimmer);
    setShowForm(true);
  };

  const handleDeleteSwimmer = (id: string) => {
    if (confirm('Are you sure you want to delete this swimmer?')) {
      deleteSwimmer(id);
      setSwimmers(getSwimmers());
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSwimmer(null);
    setSwimmers(getSwimmers());
  };

  const groupedSwimmers = swimmers.reduce((groups, swimmer) => {
    const group = groups[swimmer.ageGroup] || [];
    group.push(swimmer);
    groups[swimmer.ageGroup] = group;
    return groups;
  }, {} as Record<string, Swimmer[]>);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Swimmers</h1>
        <button
          onClick={handleAddSwimmer}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Swimmer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <SwimmerForm
              swimmer={editingSwimmer}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {swimmers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No swimmers added yet.</p>
          <button
            onClick={handleAddSwimmer}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Add Your First Swimmer
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSwimmers)
            .sort(([a], [b]) => {
              const order = ['8&U', '9-10', '11-12', '13-14', '15-18'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([ageGroup, groupSwimmers]) => (
              <div key={ageGroup} className="bg-white rounded-lg shadow">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h2 className="text-xl font-semibold">
                    {ageGroup} ({groupSwimmers.length} swimmers)
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {groupSwimmers
                      .sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`))
                      .map((swimmer) => (
                        <div
                          key={swimmer.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="font-semibold">
                                  {swimmer.lastName}, {swimmer.firstName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {swimmer.gender} • Born: {new Date(swimmer.dateOfBirth).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                Events: {swimmer.selectedEvents.length > 0 
                                  ? `${swimmer.selectedEvents.length} selected`
                                  : 'None selected'}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditSwimmer(swimmer)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSwimmer(swimmer.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

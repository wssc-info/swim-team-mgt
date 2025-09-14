'use client';

import {useState, useEffect} from 'react';
import {User, Swimmer} from '@/lib/types';
import {fetchSwimmers} from "@/lib/api";

interface FamilyAssociationFormProps {
  user: User;
  onClose: () => void;
}

export default function FamilyAssociationForm({user, onClose}: FamilyAssociationFormProps) {
  const [associatedSwimmers, setAssociatedSwimmers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);

  useEffect(() => {
    loadAssociations();
  }, [user.id]);

  const loadAssociations = async () => {
    setLoading(true);
    try {
      const [response, swimmers] = await Promise.all([
          fetch(`/api/admin/users/${user.id}/associations`),
          fetchSwimmers(user.clubId),
        ]
      );
      setSwimmers(swimmers);
      if (response.ok) {
        const associations = await response.json();
        setAssociatedSwimmers(associations);
      }
    } catch (error) {
      console.error('Error loading associations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwimmerToggle = (swimmerId: string) => {
    setAssociatedSwimmers(prev =>
      prev.includes(swimmerId)
        ? prev.filter(id => id !== swimmerId)
        : [...prev, swimmerId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}/associations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({swimmerIds: associatedSwimmers}),
      });

      if (response.ok) {
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update associations');
      }
    } catch (error) {
      console.error('Error saving associations:', error);
      setError('Failed to update associations');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading associations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Manage Swimmers for {user.firstName} {user.lastName}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Select which swimmers this family account can manage:
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
        {swimmers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No swimmers available
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {swimmers.map((swimmer) => (
              <div key={swimmer.id} className="p-3 hover:bg-gray-50">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={associatedSwimmers.includes(swimmer.id)}
                    onChange={() => handleSwimmerToggle(swimmer.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {swimmer.firstName} {swimmer.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {swimmer.gender} • Age Group: {swimmer.ageGroup} •
                      Born: {new Date(swimmer.dateOfBirth).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-3 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Associations'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Family accounts can only access event selection for their associated swimmers.
          {associatedSwimmers.length > 0 && (
            <span> Currently selected: {associatedSwimmers.length} swimmer(s).</span>
          )}
        </p>
      </div>
    </div>
  );
}

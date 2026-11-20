'use client';

import {useState, useEffect, useCallback} from 'react';
import {User, Swimmer} from '@/lib/types';
import Modal from '@/components/Modal';
import {fetchSwimmers} from "@/lib/api";
import {Input} from "@/components/ui/input";

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
  const [swimmerFilter, setSwimmerFilter] = useState(user?.lastName);



  const loadAssociations = useCallback( async () => {
    setLoading(true);
    try {
      const [response, swimmers] = await Promise.all([
          fetch(`/api/admin/users/${user.id}/associations`),
          fetchSwimmers(user.clubId),
        ]
      );
      if (response.ok) {
        const associations = await response.json();
        setAssociatedSwimmers(associations);
        swimmers.sort((s1,s2) => {
            if (associations.includes(s1.id) && !associations.includes(s2.id)) {
              return -1;
            }
            if (!associations.includes(s1.id) && associations.includes(s2.id)) {
              return 1;
            }
            const lastNameComp = s1.lastName.localeCompare(s2.lastName);
            if (lastNameComp !== 0) return lastNameComp;
            return s1.firstName.localeCompare(s2.firstName);
          });
        setSwimmers(swimmers);
      } else {
        setSwimmers(swimmers);
      }
    } catch (error) {
      console.error('Error loading associations:', error);
    } finally {
      setLoading(false);
    }
  }, [user.clubId, user.id]);

  useEffect(() => {
    loadAssociations();
  }, [loadAssociations, user.id]);


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

  const footer = (
    <div className="space-y-3">
      <div className="flex space-x-3">
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
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Family accounts can only access event selection for their associated swimmers.
          {associatedSwimmers.length > 0 && (
            <span> Currently selected: {associatedSwimmers.length} swimmer(s).</span>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <Modal title={`Manage Swimmers for ${user.firstName} ${user.lastName}`} onClose={onClose} footer={footer} size="md">
      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading associations...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <p className="text-sm text-gray-600">
            Select which swimmers this family account can manage:
          </p>
          <Input placeholder="Filter Swimmers" value={swimmerFilter}
                 onChange={(e) => setSwimmerFilter(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
            {swimmers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No swimmers available
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {swimmers
                  .filter((swimmer) => {
                    const fullName = `${swimmer.firstName} ${swimmer.lastName}`.toLowerCase();
                    return fullName.includes(swimmerFilter.toLowerCase());
                  })
                  .map((swimmer) => (
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
        </div>
      )}
    </Modal>
  );
}

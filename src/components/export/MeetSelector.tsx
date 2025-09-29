'use client';

import { Meet } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

interface MeetSelectorProps {
  meets: Meet[];
  selectedMeet: Meet | null;
  onMeetSelect: (meet: Meet) => void;
  loading: boolean;
}

export default function MeetSelector({ meets, selectedMeet, onMeetSelect, loading }: MeetSelectorProps) {
  const { user } = useAuth();
  const [activeMeetId, setActiveMeetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveMeet = async () => {
      if (user?.clubId) {
        try {
          const clubResponse = await fetch(`/api/admin/clubs/${user.clubId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (clubResponse.ok) {
            const clubData = await clubResponse.json();
            setActiveMeetId(clubData.activeMeetId || null);
          }
        } catch (error) {
          console.error('Error fetching club active meet:', error);
        }
      }
    };

    fetchActiveMeet();
  }, [user]);
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading meets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Select Meet to Export</h2>
      
      {meets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No meets available for export.</p>
          <p className="text-sm text-gray-400">Create a meet first to export data.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {meets.map((meet) => (
            <div
              key={meet.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMeet?.id === meet.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onMeetSelect(meet)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center">
                    {meet.name}
                    {activeMeetId === meet.id && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(meet.date).toLocaleDateString()} • {meet.location}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {typeof meet.availableEvents === 'string' 
                      ? JSON.parse(meet.availableEvents).length 
                      : meet.availableEvents.length} events available
                  </p>
                </div>
                <div className="flex items-center">
                  {selectedMeet?.id === meet.id && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

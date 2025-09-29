'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ActiveMeetToggleProps {
  meetId: string;
  meetName: string;
  onToggle: () => void;
}

export default function ActiveMeetToggle({ meetId, meetName, onToggle }: ActiveMeetToggleProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Check if this meet is active for the user's club
  useState(() => {
    const checkActiveStatus = async () => {
      if (user?.clubId) {
        try {
          const clubResponse = await fetch(`/api/admin/clubs/${user.clubId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (clubResponse.ok) {
            const clubData = await clubResponse.json();
            setIsActive(clubData.activeMeetId === meetId);
          }
        } catch (error) {
          console.error('Error checking active meet status:', error);
        }
      }
    };

    checkActiveStatus();
  });

  const handleToggle = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return;
    }

    setLoading(true);
    try {
      const method = isActive ? 'DELETE' : 'PUT';
      const response = await fetch(`/api/meets/${meetId}/active`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsActive(!isActive);
        onToggle();
      } else {
        const error = await response.json();
        alert(`Failed to ${isActive ? 'deactivate' : 'activate'} meet: ${error.error}`);
      }
    } catch (error) {
      console.error('Error toggling meet active status:', error);
      alert(`Failed to ${isActive ? 'deactivate' : 'activate'} meet`);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'coach') {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
        isActive
          ? 'bg-red-100 text-red-800 hover:bg-red-200'
          : 'bg-green-100 text-green-800 hover:bg-green-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Loading...' : isActive ? 'Deactivate' : 'Set Active'}
    </button>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import {authenticatedFetch} from "@/lib/api";
import { Combobox } from '@/components/ui/combobox';

interface SwimClub {
  id: string;
  name: string;
  abbreviation: string;
}

interface League {
  id: string;
  name: string;
  abbreviation: string;
}

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
  currentUserRole?: string;
  currentUserClubId?: string;
}

export default function UserForm({ user, onClose, currentUserRole, currentUserClubId }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'family' as 'admin' | 'coach' | 'family' | 'leagueAdmin',
    clubId: !user && currentUserClubId ? currentUserClubId : '',
    phoneNumber: '',
    leagueId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
        clubId: user.clubId || '',
        phoneNumber: user.phoneNumber || '',
        leagueId: user.leagueId || '',
      });
    }
  }, [user]);

  const loadClubs = async () => {
    try {
      const [clubsResp, leaguesResp] = await Promise.all([
        authenticatedFetch('/api/admin/clubs'),
        authenticatedFetch('/api/admin/leagues'),
      ]);
      if (clubsResp.ok) setClubs(await clubsResp.json());
      if (leaguesResp.ok) setLeagues(await leaguesResp.json());
    } catch (error) {
      console.error('Error loading clubs/leagues:', error);
    } finally {
      setLoadingClubs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PUT' : 'POST';
      
      const body = {
        ...formData,
        password: formData.password || undefined,
        leagueId: formData.leagueId || undefined,
      };

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="flex justify-between items-center px-6 py-4 border-b shrink-0">
        <h2 className="text-xl font-bold">
          {user ? 'Edit User' : 'Add New User'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="e.g. 555-123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password {user ? '(leave blank to keep current)' : '(leave blank to auto-generate)'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            disabled={currentUserRole !== 'admin'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="family">Family</option>
            {currentUserRole === 'admin' && <option value="coach">Coach</option>}
            {currentUserRole === 'admin' && <option value="leagueAdmin">League Admin</option>}
            {currentUserRole === 'admin' && <option value="admin">Admin</option>}
          </select>
          {currentUserRole !== 'admin' && (
            <p className="text-xs text-gray-500 mt-1">
              Only administrators can assign coach or admin roles
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Club
          </label>
          {loadingClubs ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              Loading clubs...
            </div>
          ) : (
            <Combobox
              options={(currentUserRole === 'admin' || currentUserRole === 'leagueAdmin'
                ? clubs
                : clubs.filter(c => c.id === currentUserClubId)
              ).map(c => ({ value: c.id, label: `${c.name} (${c.abbreviation})` }))}
              value={formData.clubId}
              onChange={val => setFormData(prev => ({ ...prev, clubId: val }))}
              disabled={currentUserRole !== 'admin' && currentUserRole !== 'leagueAdmin'}
              emptyLabel="No Club"
            />
          )}
          {currentUserRole !== 'admin' && currentUserRole !== 'leagueAdmin' && (
            <p className="text-xs text-gray-500 mt-1">
              Non-admin users can only assign users to their own club
            </p>
          )}
        </div>

        {currentUserRole === 'admin' && formData.role === 'leagueAdmin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              League
            </label>
            <Combobox
              options={leagues.map(l => ({ value: l.id, label: `${l.name} (${l.abbreviation})` }))}
              value={formData.leagueId}
              onChange={val => setFormData(prev => ({ ...prev, leagueId: val }))}
              emptyLabel="No League"
            />
          </div>
        )}

        </div>
        <div className="shrink-0 px-6 py-4 border-t flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

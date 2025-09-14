'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import {authenticatedFetch} from "@/lib/api";

interface SwimClub {
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
    role: 'family' as 'admin' | 'coach' | 'family',
    clubId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clubs, setClubs] = useState<SwimClub[]>([]);
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
        password: '', // Don't populate password for editing
        role: user.role,
        clubId: user.clubId || '',
      });
    }
  }, [user]);

  const loadClubs = async () => {
    try {
      const response = await fetch('/api/admin/clubs');
      if (response.ok) {
        const clubsData = await response.json();
        setClubs(clubsData);
      }
    } catch (error) {
      console.error('Error loading clubs:', error);
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
      
      const body = user 
        ? { ...formData, password: formData.password || undefined } // Only include password if provided
        : formData;

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
    <div>
      <div className="flex justify-between items-center mb-4">
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

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password {user ? '(leave blank to keep current)' : '*'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!user}
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
            {currentUserRole === 'admin' && <option value="admin">Admin</option>}
          </select>
          {currentUserRole !== 'admin' && (
            <p className="text-xs text-gray-500 mt-1">
              Only administrators can assign coach or admin roles
            </p>
          )}
        </div>

        <div>
          <label htmlFor="clubId" className="block text-sm font-medium text-gray-700 mb-1">
            Club
          </label>
          {loadingClubs ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              Loading clubs...
            </div>
          ) : (
            <select
              id="clubId"
              name="clubId"
              value={formData.clubId}
              onChange={handleChange}
              disabled={currentUserRole !== 'admin'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">No Club</option>
              {currentUserRole === 'admin' ? (
                clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.abbreviation})
                  </option>
                ))
              ) : (
                clubs
                  .filter(club => club.id === currentUserClubId)
                  .map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name} ({club.abbreviation})
                    </option>
                  ))
              )}
            </select>
          )}
          {currentUserRole !== 'admin' && (
            <p className="text-xs text-gray-500 mt-1">
              Non-admin users can only assign users to their own club
            </p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
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
    </div>
  );
}

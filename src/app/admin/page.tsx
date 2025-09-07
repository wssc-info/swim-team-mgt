'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserForm from '@/components/UserForm';
import FamilyAssociationForm from '@/components/FamilyAssociationForm';
import { User, Swimmer } from '@/lib/types';
import { fetchSwimmers } from '@/lib/api';

interface UserWithAssociations extends User {
  associatedSwimmers?: string[];
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserWithAssociations[]>([]);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithAssociations | null>(null);
  const [selectedFamilyUser, setSelectedFamilyUser] = useState<UserWithAssociations | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, swimmersData] = await Promise.all([
        fetch('/api/admin/users'),
        fetchSwimmers()
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
      setSwimmers(swimmersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (user: UserWithAssociations) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleManageAssociations = (user: UserWithAssociations) => {
    setSelectedFamilyUser(user);
    setShowAssociationForm(true);
  };

  const handleUserFormClose = () => {
    setShowUserForm(false);
    setEditingUser(null);
    loadData();
  };

  const handleAssociationFormClose = () => {
    setShowAssociationForm(false);
    setSelectedFamilyUser(null);
    loadData();
  };

  const getSwimmerNames = (swimmerIds: string[]) => {
    return swimmerIds
      .map(id => {
        const swimmer = swimmers.find(s => s.id === id);
        return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown';
      })
      .join(', ');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['coach']}>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['coach']}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Administration</h1>
          <button
            onClick={() => setShowUserForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New User
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Associated Swimmers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'coach' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {user.role === 'family' && user.associatedSwimmers ? (
                        user.associatedSwimmers.length > 0 ? (
                          <div className="max-w-xs truncate" title={getSwimmerNames(user.associatedSwimmers)}>
                            {getSwimmerNames(user.associatedSwimmers)}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No swimmers assigned</span>
                        )
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    {user.role === 'family' && (
                      <button
                        onClick={() => handleManageAssociations(user)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Manage Swimmers
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found. Create your first user to get started.
            </div>
          )}
        </div>

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <UserForm
                user={editingUser}
                onClose={handleUserFormClose}
              />
            </div>
          </div>
        )}

        {/* Family Association Form Modal */}
        {showAssociationForm && selectedFamilyUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <FamilyAssociationForm
                user={selectedFamilyUser}
                swimmers={swimmers}
                onClose={handleAssociationFormClose}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

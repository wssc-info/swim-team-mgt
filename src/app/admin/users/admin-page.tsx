'use client';

import {useState, useEffect} from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserForm from '@/components/UserForm';
import FamilyAssociationForm from '@/components/FamilyAssociationForm';
import {User, Swimmer} from '@/lib/types';
import {authenticatedFetch, fetchSwimmers} from '@/lib/api';
import {useAuth} from '@/lib/auth-context';

interface UserWithAssociations extends User {
  associatedSwimmers?: string[];
}

export default function AdminPage() {
  const {user: currentUser} = useAuth();
  const [users, setUsers] = useState<UserWithAssociations[]>([]);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAssociationForm, setShowAssociationForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithAssociations | null>(null);
  const [selectedFamilyUser, setSelectedFamilyUser] = useState<UserWithAssociations | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number, errors: string[] } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, swimmersData] = await Promise.all([
        authenticatedFetch('/api/admin/users'),
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['email', 'password', 'firstname', 'lastname', 'role'];

      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`CSV file is missing required columns: ${missingHeaders.join(', ')}\nRequired columns: email, password, firstname, lastname, role\nOptional: swimmers (comma-separated swimmer names)`);
        return;
      }

      const results = {success: 0, errors: [] as string[]};

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        try {
          // Validate required fields
          if (!row.email || !row.password || !row.firstname || !row.lastname || !row.role) {
            results.errors.push(`Row ${i}: Missing required fields (email, password, firstname, lastname, role)`);
            continue;
          }

          let role = row.role.toLowerCase();
          if (!['admin', 'coach', 'family'].includes(role)) {
            results.errors.push(`Row ${i}: Invalid role "${row.role}". Must be "admin", "coach", or "family"`);
            continue;
          }

          // Only admins can create admin or coach users via CSV
          if (currentUser?.role !== 'admin' && (role === 'admin' || role === 'coach')) {
            role = 'family'; // Force to family role if not admin
          }

          // Validate email format (basic check)
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            results.errors.push(`Row ${i}: Invalid email format "${row.email}"`);
            continue;
          }

          // Check if user already exists
          const existingUser = users.find(u => u.email.toLowerCase() === row.email.toLowerCase());
          if (existingUser) {
            results.errors.push(`Row ${i}: User with email "${row.email}" already exists`);
            continue;
          }

          // Create user
          const userData = {
            email: row.email,
            password: row.password,
            firstName: row.firstname,
            lastName: row.lastname,
            role: role,
            clubId: currentUser?.role === 'admin' ? row.clubId || null : currentUser?.clubId || null,
          };

          const userResponse = await authenticatedFetch('/api/admin/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!userResponse.ok) {
            const error = await userResponse.text();
            results.errors.push(`Row ${i}: Failed to create user - ${error}`);
            continue;
          }

          const newUser = await userResponse.json();

          // Handle swimmer associations for family users
          if (role === 'family' && row.swimmers) {
            const swimmerNames = row.swimmers.split(';').map(name => name.trim()).filter(name => name);

            if (swimmerNames.length > 0) {
              const swimmerIds: string[] = [];

              for (const swimmerName of swimmerNames) {
                // Try to find swimmer by "First Last" or "Last, First" format
                const swimmer = swimmers.find(s => {
                  const fullName1 = `${s.firstName} ${s.lastName}`.toLowerCase();
                  const fullName2 = `${s.lastName}, ${s.firstName}`.toLowerCase();
                  return fullName1 === swimmerName.toLowerCase() || fullName2 === swimmerName.toLowerCase();
                });

                if (swimmer) {
                  swimmerIds.push(swimmer.id);
                } else {
                  results.errors.push(`Row ${i}: Swimmer "${swimmerName}" not found for user ${row.email}`);
                }
              }

              // Associate swimmers with the user
              if (swimmerIds.length > 0) {
                try {
                  const associationResponse = await fetch(`/api/admin/users/${newUser.id}/associations`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({swimmerIds}),
                  });

                  if (!associationResponse.ok) {
                    const error = await associationResponse.text();
                    results.errors.push(`Row ${i}: Failed to associate swimmers with user ${row.email} - ${error}`);
                  }
                } catch (error) {
                  results.errors.push(`Row ${i}: Error associating swimmers with user ${row.email} - ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }
            }
          }

          results.success++;
        } catch (error) {
          results.errors.push(`Row ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setUploadResults(results);
      await loadData();
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the file format.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
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
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Administration</h1>
          <div className="flex space-x-3">
            <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
              {uploading ? 'Uploading...' : 'Import CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowUserForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add New User
            </button>
          </div>
        </div>

        {/* Upload Results */}
        {uploadResults && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Import Results</h3>
            <div className="space-y-2">
              <p className="text-green-600">Successfully imported: {uploadResults.success} users</p>
              {uploadResults.errors.length > 0 && (
                <div>
                  <p className="text-red-600 font-medium">Errors ({uploadResults.errors.length}):</p>
                  <ul className="text-sm text-red-600 ml-4 max-h-32 overflow-y-auto">
                    {uploadResults.errors.map((error, index) => (
                      <li key={index} className="list-disc">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setUploadResults(null)}
              className="mt-3 text-sm text-gray-600 hover:text-gray-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CSV Format Help */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">CSV Import Format</h3>
          <p className="text-sm text-blue-700 mb-2">
            Your CSV file should have these columns: <code>email, password, firstname, lastname, role</code>
          </p>
          <p className="text-sm text-blue-700 mb-2">
            Optional column: <code>swimmers</code> (semicolon-separated swimmer names for family users)
          </p>
          <p className="text-xs text-blue-600">
            Example: &#34;john@example.com, password123, John, Smith, family, Jane Smith;Bob Smith&#34;
          </p>
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
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'coach'
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
                currentUserRole={currentUser?.role}
                currentUserClubId={currentUser?.clubId}
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
    </div>
  );
}

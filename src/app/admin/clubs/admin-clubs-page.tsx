'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Building2 } from 'lucide-react';

interface SwimClub {
  id: string;
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClubFormData {
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState<SwimClub | null>(null);
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    abbreviation: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/admin/clubs');
      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingClub ? `/api/admin/clubs/${editingClub.id}` : '/api/admin/clubs';
      const method = editingClub ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchClubs();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save club');
      }
    } catch (error) {
      console.error('Error saving club:', error);
      alert('Failed to save club');
    }
  };

  const handleEdit = (club: SwimClub) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      abbreviation: club.abbreviation,
      address: club.address,
      city: club.city,
      state: club.state,
      zipCode: club.zipCode,
      phone: club.phone || '',
      email: club.email || '',
      website: club.website || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (club: SwimClub) => {
    if (!confirm(`Are you sure you want to delete ${club.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clubs/${club.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchClubs();
      } else {
        alert('Failed to delete club');
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      alert('Failed to delete club');
    }
  };

  const toggleActive = async (club: SwimClub) => {
    try {
      const response = await fetch(`/api/admin/clubs/${club.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !club.isActive }),
      });

      if (response.ok) {
        await fetchClubs();
      } else {
        alert('Failed to update club status');
      }
    } catch (error) {
      console.error('Error updating club status:', error);
      alert('Failed to update club status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      abbreviation: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      website: ''
    });
    setEditingClub(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading clubs...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Swim Club Administration</h1>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Club</span>
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingClub ? 'Edit Club' : 'Add New Club'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Club Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="abbreviation">Abbreviation *</Label>
                  <Input
                    id="abbreviation"
                    value={formData.abbreviation}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                    maxLength={10}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingClub ? 'Update Club' : 'Add Club'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {clubs.map((club) => (
          <Card key={club.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold">{club.name}</h3>
                    <Badge variant={club.isActive ? "default" : "secondary"}>
                      {club.abbreviation}
                    </Badge>
                    <Badge variant={club.isActive ? "default" : "outline"}>
                      {club.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <p>{club.address}</p>
                    <p>{club.city}, {club.state} {club.zipCode}</p>
                    {club.phone && <p>Phone: {club.phone}</p>}
                    {club.email && <p>Email: {club.email}</p>}
                    {club.website && <p>Website: {club.website}</p>}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(club)}
                  >
                    {club.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(club)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(club)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {clubs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clubs found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first swim club.</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Club
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

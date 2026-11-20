'use client';

import {useEffect, useState} from 'react';
import {authenticatedFetch, createSwimmer, updateSwimmerApi} from '@/lib/api';
import Modal from '@/components/Modal';
import {Swimmer} from '@/lib/types';
import {useAuth} from '@/lib/auth-context';
import {generateSwimmerExternalId, calculateAgeGroup} from "@/lib/utils";
import {SquarePenIcon} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Checkbox} from "@/components/ui/checkbox";
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';

interface SwimClub {
  id: string;
  name: string;
  abbreviation: string;
}

interface SwimmerFormProps {
  swimmer?: Swimmer | null;
  onClose: () => void;
}

export default function SwimmerForm({ swimmer, onClose }: SwimmerFormProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    middleInitial: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M' as 'M' | 'F',
    clubId: '',
    externalId: '',
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clubs, setClubs] = useState<SwimClub[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  type Association = {
    id: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    familyUser: { id: string; firstName: string; lastName: string; email: string } | null;
  };
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loadingAssociations, setLoadingAssociations] = useState(false);

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (swimmer?.id) loadAssociations(swimmer.id);
  }, [swimmer?.id]);

  const loadAssociations = async (swimmerId: string) => {
    setLoadingAssociations(true);
    try {
      const res = await authenticatedFetch(`/api/admin/associations?swimmerId=${swimmerId}&status=all`);
      if (res.ok) setAssociations(await res.json());
    } catch (e) {
      console.error('Error loading associations:', e);
    } finally {
      setLoadingAssociations(false);
    }
  };

  const handleAssociationAction = async (assocId: string, action: 'approve' | 'deny' | 'remove') => {
    if (action === 'remove') {
      if (!confirm('Remove this family association?')) return;
      await authenticatedFetch(`/api/admin/associations/${assocId}`, { method: 'DELETE' });
    } else {
      await authenticatedFetch(`/api/admin/associations/${assocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    }
    if (swimmer?.id) loadAssociations(swimmer.id);
  };

  useEffect(() => {
    if (swimmer) {
      setFormData({
        firstName: swimmer.firstName,
        middleInitial: swimmer.middleInitial || '',
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        gender: swimmer.gender,
        clubId: swimmer.clubId || '',
        externalId: swimmer.externalId || '',
        active: swimmer.active || true,
      });
    } else if (currentUser?.clubId && currentUser.role !== 'admin') {
      // Auto-assign current user's club for non-admin users
      setFormData(prev => ({
        ...prev,
        clubId: currentUser.clubId || '',
      }));
    }
  }, [swimmer, currentUser]);

  const loadClubs = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/clubs');
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (swimmer) {
        await updateSwimmerApi(swimmer.id, formData);
      } else {
        await createSwimmer(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving swimmer:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const inputValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const predictedAgeGroup = formData.dateOfBirth ? calculateAgeGroup(formData.dateOfBirth) : '';

  const generateExternalId = () => {
    try {
      const externalId = generateSwimmerExternalId(formData);
      setFormData(prev => ({ ...prev, externalId }));
    } catch (error) {
      console.error('Error generating external ID:', error);
      alert('First name, last name, and date of birth are required to generate external ID');
    }
  }

  const footer = (
    <div className="flex space-x-3">
      <Button type="submit" form="swimmer-form" className="flex-1">
        {swimmer ? 'Update Swimmer' : 'Add Swimmer'}
      </Button>
      <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
        Cancel
      </Button>
    </div>
  );

  return (
    <Modal title={swimmer ? 'Edit Swimmer' : 'Add New Swimmer'} onClose={onClose} footer={footer}>
      <form id="swimmer-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label htmlFor="middleInitial" className="block text-sm font-medium text-gray-700 mb-1">
            Middle Initial
          </label>
          <input
            type="text"
            id="middleInitial"
            name="middleInitial"
            value={formData.middleInitial}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.middleInitial ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter middle initial"
          />
          {errors.middleInitial && (
            <p className="text-red-500 text-sm mt-1">{errors.middleInitial}</p>
          )}
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
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
          )}
          {predictedAgeGroup && (
            <p className="text-sm text-gray-600 mt-1">
              Age Group: {predictedAgeGroup}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        <div>
          <label htmlFor="externalId" className="block text-sm font-medium text-gray-700 mb-1">
            External ID <Tooltip>
              <TooltipTrigger asChild>
                <SquarePenIcon onClick={generateExternalId} className="inline"/>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate a unique ID</p>
              </TooltipContent>
            </Tooltip>

          </label>
          <input
            type="text"
            id="externalId"
            name="externalId"
            value={formData.externalId}
            onChange={handleInputChange}
            maxLength={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., USA Swimming ID, Team Manager ID"
          />
          <p className="text-xs text-gray-500 mt-1">
            Identifier from external systems (USA Swimming, Team Manager, etc.)
          </p>
        </div>

        <div className="flex space-x-6">
          <div className="text-center items-center">
            <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
              Active
            </label>
            <input type="checkbox"
                   id="active"
                   name="active"
                   checked={formData.active}
                   onChange={handleInputChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Club
            </label>
            {loadingClubs ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                Loading clubs...
              </div>
            ) : (
              <Combobox
                options={(currentUser?.role === 'admin' || currentUser?.role === 'leagueAdmin'
                  ? clubs
                  : clubs.filter(club => club.id === currentUser?.clubId)
                ).map(club => ({ value: club.id, label: `${club.name} (${club.abbreviation})` }))}
                value={formData.clubId}
                onChange={val => setFormData(prev => ({ ...prev, clubId: val }))}
                disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'leagueAdmin'}
                emptyLabel="No Club"
              />
            )}
          </div>
        </div>
      </form>

      {swimmer && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Associated Families</h4>
          {loadingAssociations ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : associations.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No family associations</p>
          ) : (
            <div className="space-y-2">
              {associations.map(assoc => (
                <div key={assoc.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">
                      {assoc.familyUser ? `${assoc.familyUser.firstName} ${assoc.familyUser.lastName}` : '—'}
                    </span>
                    {assoc.familyUser?.email && (
                      <span className="ml-2 text-gray-500 text-xs">{assoc.familyUser.email}</span>
                    )}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      assoc.status === 'approved' ? 'bg-green-100 text-green-700' :
                      assoc.status === 'denied'   ? 'bg-red-100 text-red-600' :
                                                    'bg-yellow-100 text-yellow-700'
                    }`}>
                      {assoc.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {assoc.status === 'pending' && (
                      <>
                        <Button size="sm" className="h-6 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleAssociationAction(assoc.id, 'approve')}>Approve</Button>
                        <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => handleAssociationAction(assoc.id, 'deny')}>Deny</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleAssociationAction(assoc.id, 'remove')}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

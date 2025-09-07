'use client';

import { useState, useEffect } from 'react';
import { createSwimmer, updateSwimmerApi } from '@/lib/api';
import { Swimmer } from '@/lib/types';
// Calculate age group based on birth date
function calculateAgeGroup(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;

  if (actualAge <= 8) return '8&U';
  if (actualAge <= 10) return '9-10';
  if (actualAge <= 12) return '11-12';
  if (actualAge <= 14) return '13-14';
  return '15-18';
}

interface SwimmerFormProps {
  swimmer?: Swimmer | null;
  onClose: () => void;
}

export default function SwimmerForm({ swimmer, onClose }: SwimmerFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M' as 'M' | 'F',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (swimmer) {
      setFormData({
        firstName: swimmer.firstName,
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        gender: swimmer.gender
      });
    }
  }, [swimmer]);

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
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {swimmer ? 'Edit Swimmer' : 'Add New Swimmer'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

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

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {swimmer ? 'Update Swimmer' : 'Add Swimmer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

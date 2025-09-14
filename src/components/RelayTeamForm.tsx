'use client';

import { useState, useEffect } from 'react';
import { createRelayTeam, updateRelayTeamApi } from '@/lib/api';
import {SwimEvent} from "@/lib/types";

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
}

interface RelayTeam {
  id: string;
  meetId: string;
  eventId: string;
  name: string;
  swimmers: string[];
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

interface RelayTeamFormProps {
  team?: RelayTeam | null;
  swimmers: Swimmer[];
  availableEvents: SwimEvent[];
  meetId: string;
  onClose: () => void;
}

export default function RelayTeamForm({ team, swimmers, availableEvents, meetId, onClose }: RelayTeamFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    eventId: '',
    swimmers: [] as string[],
    ageGroup: '',
    gender: 'Mixed' as 'M' | 'F' | 'Mixed'
  });
  const [saving, setSaving] = useState(false);
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        eventId: team.eventId,
        swimmers: [...team.swimmers],
        ageGroup: team.ageGroup,
        gender: team.gender
      });
    }
  }, [team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.eventId || formData.swimmers.length === 0) {
      alert('Please fill in all required fields and select at least one swimmer');
      return;
    }

    if (formData.swimmers.length > 4) {
      alert('A relay team cannot have more than 4 swimmers');
      return;
    }

    setSaving(true);
    try {
      if (team) {
        await updateRelayTeamApi(team.id, formData);
      } else {
        await createRelayTeam({ ...formData, meetId });
      }
      onClose();
    } catch (error) {
      console.error('Error saving relay team:', error);
      alert('Failed to save relay team');
    } finally {
      setSaving(false);
    }
  };

  const handleSwimmerToggle = (swimmerId: string) => {
    setFormData(prev => ({
      ...prev,
      swimmers: prev.swimmers.includes(swimmerId)
        ? prev.swimmers.filter(id => id !== swimmerId)
        : prev.swimmers.length < 4
        ? [...prev.swimmers, swimmerId]
        : prev.swimmers
    }));
  };

  const moveSwimmerUp = (index: number) => {
    if (index > 0) {
      const newSwimmers = [...formData.swimmers];
      [newSwimmers[index - 1], newSwimmers[index]] = [newSwimmers[index], newSwimmers[index - 1]];
      setFormData(prev => ({ ...prev, swimmers: newSwimmers }));
    }
  };

  const moveSwimmerDown = (index: number) => {
    if (index < formData.swimmers.length - 1) {
      const newSwimmers = [...formData.swimmers];
      [newSwimmers[index], newSwimmers[index + 1]] = [newSwimmers[index + 1], newSwimmers[index]];
      setFormData(prev => ({ ...prev, swimmers: newSwimmers }));
    }
  };

  const removeSwimmer = (swimmerId: string) => {
    setFormData(prev => ({
      ...prev,
      swimmers: prev.swimmers.filter(id => id !== swimmerId)
    }));
  };

  const getSwimmerName = (swimmerId: string) => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    return swimmer ? `${swimmer.firstName} ${swimmer.lastName}` : 'Unknown Swimmer';
  };

  const getSwimmer = (swimmerId: string) => {
    return swimmers.find(s => s.id === swimmerId);
  };

  // Filter swimmers based on selected filters
  const filteredSwimmers = swimmers.filter(swimmer => {
    if (ageGroupFilter !== 'all' && swimmer.ageGroup !== ageGroupFilter) return false;
    if (genderFilter !== 'all' && swimmer.gender !== genderFilter) return false;
    return true;
  });

  // Get unique age groups and determine team age group
  const ageGroups = [...new Set(swimmers.map(s => s.ageGroup))].sort();
  const selectedSwimmers = formData.swimmers.map(id => swimmers.find(s => s.id === id)).filter(Boolean);

  // Auto-calculate team age group and gender
  useEffect(() => {
    const teamAgeGroups = [...new Set(selectedSwimmers.map(s => s!.ageGroup))];
    const teamGenders = [...new Set(selectedSwimmers.map(s => s!.gender))];

    if (selectedSwimmers.length > 0) {
      // For age group, use the oldest age group
      const ageGroupOrder = ['8&U', '9-10', '11-12', '13-14', '15-18'];
      const maxAgeGroup = teamAgeGroups.reduce((max, current) => {
        return ageGroupOrder.indexOf(current) > ageGroupOrder.indexOf(max) ? current : max;
      }, teamAgeGroups[0]);

      // For gender, determine if mixed or single gender
      const calculatedGender = teamGenders.length > 1 ? 'Mixed' : teamGenders[0] as 'M' | 'F' | 'Mixed';

      setFormData(prev => ({
        ...prev,
        ageGroup: maxAgeGroup,
        gender: calculatedGender
      }));
    }
  }, [formData.swimmers, selectedSwimmers]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {team ? 'Edit Relay Team' : 'Create Relay Team'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., Lightning Bolts"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event *
            </label>
            <select
              value={formData.eventId}
              onChange={(e) => setFormData(prev => ({ ...prev, eventId: e.target.value }))}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Event</option>
              {availableEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Info (Auto-calculated) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age Group (Auto-calculated)
            </label>
            <input
              type="text"
              value={formData.ageGroup}
              className="w-full p-2 border rounded-md bg-gray-100"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender (Auto-calculated)
            </label>
            <input
              type="text"
              value={formData.gender}
              className="w-full p-2 border rounded-md bg-gray-100"
              readOnly
            />
          </div>
        </div>

        {/* Selected Swimmers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Swimmers ({formData.swimmers.length}/4)
          </label>
          {formData.swimmers.length === 0 ? (
            <p className="text-gray-500 text-sm">No swimmers selected</p>
          ) : (
            <div className="space-y-2">
              {formData.swimmers.map((swimmerId, index) => {
                const swimmer = getSwimmer(swimmerId);
                return (
                  <div key={swimmerId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-blue-800">#{index + 1}</span>
                      <div>
                        <span className="font-medium">{getSwimmerName(swimmerId)}</span>
                        {swimmer && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({swimmer.ageGroup}, {swimmer.gender})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => moveSwimmerUp(index)}
                        disabled={index === 0}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSwimmerDown(index)}
                        disabled={index === formData.swimmers.length - 1}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSwimmer(swimmerId)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Swimmer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Swimmers
          </label>
          
          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Age Group</label>
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="p-1 border rounded text-sm"
              >
                <option value="all">All Ages</option>
                {ageGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="p-1 border rounded text-sm"
              >
                <option value="all">All</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {filteredSwimmers.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No swimmers match the current filters</p>
            ) : (
              <div className="space-y-1 p-2">
                {filteredSwimmers.map(swimmer => (
                  <label
                    key={swimmer.id}
                    className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                      formData.swimmers.includes(swimmer.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.swimmers.includes(swimmer.id)}
                      onChange={() => handleSwimmerToggle(swimmer.id)}
                      disabled={!formData.swimmers.includes(swimmer.id) && formData.swimmers.length >= 4}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <span className="font-medium">
                        {swimmer.firstName} {swimmer.lastName}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({swimmer.ageGroup}, {swimmer.gender})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || formData.swimmers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
          </button>
        </div>
      </form>
    </div>
  );
}

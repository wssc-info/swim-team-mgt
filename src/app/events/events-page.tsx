'use client';

import { useState, useEffect } from 'react';
import { fetchSwimmers, fetchMeets, fetchAssociatedSwimmers, fetchSwimmerMeetEvents, fetchAllEvents } from '@/lib/api';
import {Meet, SwimEvent} from '@/lib/types';
import EventSelection from '@/components/EventSelection';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import { DataTable } from "@/components/datatable/dataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Swimmer {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
}

interface SwimmerWithEvents extends Swimmer {
  selectedEvents?: string[];
}


export function EventsPage() {
  const { user } = useAuth();
  const [swimmers, setSwimmers] = useState<SwimmerWithEvents[]>([]);
  const [activeMeet, setActiveMeet] = useState<Meet | null>(null);
  const [selectedSwimmer, setSelectedSwimmer] = useState<Swimmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<SwimEvent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meetData, eventsData] = await Promise.all([
          fetchMeets(),
          fetchAllEvents()
        ]);
        
        // Filter meets to only show those for the user's club and find active meet
        const filteredMeets = user?.clubId 
          ? meetData.filter(meet => meet.clubId === user.clubId)
          : meetData;

        const active = filteredMeets.find(m => m.isActive) || null;

        setActiveMeet(active);
        setAllEvents(eventsData);

        // Fetch swimmers based on user role
        let swimmerData: Swimmer[];
        if (user?.role === 'family' && user?.id) {
          // For family users, only fetch their associated swimmers
          swimmerData = await fetchAssociatedSwimmers(user.id);
        } else {
          // For coaches, fetch all swimmers
          swimmerData = await fetchSwimmers();
        }
        
        // If we have an active meet, load event selections for each swimmer
        if (active) {
          const swimmersWithEvents = await Promise.all(
            swimmerData.map(async (swimmer) => {
              try {
                const swimmerMeetEvents = await fetchSwimmerMeetEvents(swimmer.id, active.id);
                const selectedEvents = swimmerMeetEvents.map(sme => sme.eventId);
                return { ...swimmer, selectedEvents };
              } catch (error) {
                console.error(`Error loading events for swimmer ${swimmer.id}:`, error);
                return { ...swimmer, selectedEvents: [] };
              }
            })
          );
          setSwimmers(swimmersWithEvents);
        } else {
          // No active meet, so no selected events
          setSwimmers(swimmerData.map(swimmer => ({ ...swimmer, selectedEvents: [] })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleSwimmerSelect = (swimmer: Swimmer) => {
    setSelectedSwimmer(swimmer);
  };

  const handleEventSelectionClose = async () => {
    setSelectedSwimmer(null);
    // Refresh swimmers data to show updated selections
    if (!activeMeet) return;
    
    try {
      let swimmerData: Swimmer[];
      if (user?.role === 'family' && user?.id) {
        swimmerData = await fetchAssociatedSwimmers(user.id);
      } else {
        swimmerData = await fetchSwimmers();
      }
      
      // Load event selections for each swimmer
      const swimmersWithEvents = await Promise.all(
        swimmerData.map(async (swimmer) => {
          try {
            const swimmerMeetEvents = await fetchSwimmerMeetEvents(swimmer.id, activeMeet.id);
            const selectedEvents = swimmerMeetEvents.map(sme => sme.eventId);
            return { ...swimmer, selectedEvents };
          } catch (error) {
            console.error(`Error loading events for swimmer ${swimmer.id}:`, error);
            return { ...swimmer, selectedEvents: [] };
          }
        })
      );
      setSwimmers(swimmersWithEvents);
    } catch (error) {
      console.error('Error refreshing swimmers:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.clubId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Club Association</h2>
          <p className="text-yellow-700">
            You need to be associated with a club to register for events. Please contact an administrator 
            to assign you to a club.
          </p>
        </div>
      </div>
    );
  }

  if (!activeMeet) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Active Meet</h2>
          <p className="text-yellow-700">
            There is currently no active meet available for event registration. 
            Please contact your coach to set up a meet.
          </p>
        </div>
      </div>
    );
  }

  if (swimmers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">No Swimmers Found</h2>
          <p className="text-blue-700">
            No swimmers have been added to the system yet. 
            Please contact your coach to add swimmers before registering for events.
          </p>
        </div>
      </div>
    );
  }

  const availableEvents = activeMeet.availableEvents
    .map(eventId => allEvents.find(e => e.id === eventId))
    .filter(Boolean) as SwimEvent[];

  // Create columns for the swimmers data table
  const swimmerColumns: ColumnDef<SwimmerWithEvents>[] = [
    {
      accessorKey: "lastName",
      header: "Last Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.lastName}</span>
      ),
    },
    {
      accessorKey: "firstName", 
      header: "First Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.firstName}</span>
      ),
    },
    {
      accessorKey: "ageGroup",
      header: "Age Group",
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {row.original.ageGroup}
        </span>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.gender}</span>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.dateOfBirth).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "eventsSelected",
      header: "Events Selected",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.selectedEvents?.length || 0}
        </span>
      ),
    },
    {
      id: "eventsAvailable",
      header: "Events Available",
      cell: ({ row }) => {
        const eligibleEvents = availableEvents.filter(event => 
          event.ageGroups.includes(row.original.ageGroup)
        );
        return (
          <span className="text-sm text-gray-600">
            {eligibleEvents.length}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => handleSwimmerSelect(row.original)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Select Events
        </button>
      ),
    },
  ];

  // Create filters for the data table
  const createFilters = (table: any) => {
    return (
      <>
        <Input
          placeholder="Filter by last name..."
          value={(table.getColumn("lastName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("lastName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select 
          value={(table.getColumn("ageGroup")?.getFilterValue() as string) ?? "ALL"}
          onValueChange={(value) => {
            if (value === "ALL") {
              table.getColumn("ageGroup")?.setFilterValue(undefined);
            } else {
              table.getColumn("ageGroup")?.setFilterValue(value);
            }
          }}
        >
          <SelectTrigger className="ml-4 max-w-sm">
            <SelectValue placeholder="Filter by age group..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8&U">8 & Under</SelectItem>
            <SelectItem value="9-10">9-10</SelectItem>
            <SelectItem value="11-12">11-12</SelectItem>
            <SelectItem value="13-14">13-14</SelectItem>
            <SelectItem value="15-18">15-18</SelectItem>
            <SelectItem value="ALL">All Age Groups</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={(table.getColumn("gender")?.getFilterValue() as string) ?? "ALL"}
          onValueChange={(value) => {
            if (value === "ALL") {
              table.getColumn("gender")?.setFilterValue(undefined);
            } else {
              table.getColumn("gender")?.setFilterValue(value);
            }
          }}
        >
          <SelectTrigger className="ml-4 max-w-sm">
            <SelectValue placeholder="Filter by gender..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
            <SelectItem value="ALL">All Genders</SelectItem>
          </SelectContent>
        </Select>
      </>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Event Registration</h1>
      
      {/* Active Meet Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">
          {activeMeet.name}
        </h2>
        <p className="text-green-700 mb-2">
          {new Date(activeMeet.date).toLocaleDateString()} • {activeMeet.location}
        </p>
        <p className="text-sm text-green-600">
          {availableEvents.length} events available for registration
        </p>
      </div>

      {/* Event Selection Modal */}
      {selectedSwimmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <EventSelection
              swimmer={selectedSwimmer}
              meet={activeMeet}
              availableEvents={availableEvents}
              onClose={handleEventSelectionClose}
            />
          </div>
        </div>
      )}

      {/* Swimmers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-2">
            Swimmers ({swimmers.length} total)
          </h2>
          <p className="text-sm text-gray-600">
            Select events for each swimmer below
          </p>
        </div>
        <div className="p-6">
          <DataTable 
            columns={swimmerColumns} 
            data={swimmers.sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`))}
            filters={createFilters}
          />
        </div>
      </div>
    </div>
  );
}

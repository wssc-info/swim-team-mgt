'use client';

import {useState, useEffect} from 'react';
import {fetchMeets, deleteMeetApi, activateMeet, fetchAllEvents, fetchClubs, fetchClub} from '@/lib/api';
import MeetForm from '@/components/MeetForm';
import {Spinner} from "@/components/ui/shadcn-io/spinner";
import {SwimClub, SwimEvent} from "@/lib/types";
import {Meet} from "@/lib/types";
import {useAuth} from '@/lib/auth-context';
import {getClubId} from '@/lib/utils';
import {DataTable} from "@/components/datatable/dataTable";
import {createMeetsColumns} from "@/app/meets/meets-columns";

export default function MeetsPage() {
  const { user } = useAuth();
  const [club, setClub] = useState<SwimClub>();
  const [loading, setLoading] = useState<boolean>(true);
  const [meets, setMeets] = useState<Meet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMeet, setEditingMeet] = useState<Partial<Meet> | null>(null);
  const [allEvents, setAllEvents] = useState<SwimEvent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const clubId = getClubId(user);
        const [meetData, eventsData, clubData] = await Promise.all([
          fetchMeets(false, clubId),
          fetchAllEvents(),
          fetchClub(clubId),
        ]);
        setMeets(meetData);
        setAllEvents(eventsData);
        setClub(clubData);
      } catch (error) {
        console.error('Error loading meets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  const handleAddMeet = () => {
    setEditingMeet(null);
    setShowForm(true);
  };

  const handleEditMeet = (meet: Meet) => {
    setEditingMeet(meet);
    setShowForm(true);
  };

  const handleCloneMeet = (meet: Meet) => {
    setEditingMeet({meetEvents: meet.meetEvents, course: meet.course});
    setShowForm(true);
  };

  const handleMeetFunctions = (action: string, meet: Meet) => {
    if ("edit" === action) {
      handleEditMeet(meet);
    } else if ("delete" === action && meet.id) {
      handleDeleteMeet(meet.id);
    } else if ("clone" === action) {
      handleCloneMeet(meet);
    } else if ("activate" === action && meet?.id && club?.id) {
      handleSetActive(meet?.id);
    }
  }

  const handleDeleteMeet = async (id: string) => {
    if (confirm('Are you sure you want to delete this meet?')) {
      try {
        await deleteMeetApi(id);
        const updatedMeets = await fetchMeets(false, getClubId(user));
        setMeets(updatedMeets);
      } catch (error) {
        console.error('Error deleting meet:', error);
      }
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await activateMeet(id, getClubId(user));
      setClub(prevState => ({...prevState, activeMeetId: id} as SwimClub));
    } catch (error) {
      console.error('Error setting active meet:', error);
    }
  };

  const handleFormClose = async () => {
    setShowForm(false);
    setEditingMeet(null);
    try {
      const updatedMeets = await fetchMeets(false, getClubId(user));
      setMeets(updatedMeets);
    } catch (error) {
      console.error('Error loading meets:', error);
    }
  };

  const activeMeet = meets.find(m => m.id === club?.activeMeetId);
  const now = new Date();
  const upcomingMeets = meets
    .filter(m =>  now.getTime() < new Date(m.date).getTime())
    .sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const pastMeets = meets
    .filter(m =>  now.getTime() > new Date(m.date).getTime())
    .sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  if (loading) {
    return <div className={'items-center text-center'}>
      <Spinner size={64} variant={'circle'} speed={1} className={'mr-auto ml-auto my-5'}/>
    </div>;
  }

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Manage Meets</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Club Selected</h2>
          <p className="text-yellow-700">
            {user?.role === 'admin'
              ? 'Please select a club from the navigation bar to manage meets.'
              : 'You need to be associated with a club to manage meets. Please contact an administrator to assign you to a club.'}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Meets</h1>
        <button
          onClick={handleAddMeet}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create New Meet
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <MeetForm
              meet={editingMeet}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Active Meet Section */}
      {activeMeet && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">Active Meet</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-green-800">{activeMeet.name}</h3>
                <p className="text-green-700 mt-1">
                  {new Date(activeMeet.date).toLocaleDateString()} • {activeMeet.location} • {activeMeet.course}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {activeMeet.meetEvents.length} event entries configured for this meet
                </p>
                <div className="mt-3">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-green-700 hover:text-green-800">
                      View Meet Events ({activeMeet.meetEvents.length})
                    </summary>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {activeMeet.meetEvents
                        .sort((a, b) => a.eventNumber - b.eventNumber)
                        .map(meetEvent => {
                          const event = allEvents.find(e => e.id === meetEvent.eventId);
                          return event ? (
                            <span key={`${meetEvent.eventNumber}-${meetEvent.eventId}-${meetEvent.ageGroup}`} className="text-xs bg-green-100 px-2 py-1 rounded">
                              Event #{meetEvent.eventNumber}: {event.name} - {meetEvent.ageGroup}
                            </span>
                          ) : null;
                        })}
                    </div>
                  </details>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEditMeet(activeMeet)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!activeMeet && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> No active meet is set. Swimmers won't be able to register for events until you set a
            meet as active.
          </p>
        </div>
      )}

      {/* Upcoming Meets Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
           Upcoming Meets
        </h2>
        {upcomingMeets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No upcoming meets scheduled.</p>
            <button
              onClick={handleAddMeet}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create New Meet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
                columns={createMeetsColumns(handleMeetFunctions, activeMeet)}
                data={upcomingMeets}
                defaultPageSize={20}
                pageSizeOptions={[10,20,50]}
            />
          </div>
        )}
      </div>

      <div>
      <h2 className="text-2xl font-semibold mb-4">
        Past Meets
      </h2>
      {pastMeets.length > 0 && (
        <div className="space-y-4">
          <DataTable
            columns={createMeetsColumns(handleMeetFunctions, activeMeet)}
            data={pastMeets}
            defaultPageSize={20}
            pageSizeOptions={[10,20,50]}
          />
        </div>
      )}
      </div>


    </div>
  );
}

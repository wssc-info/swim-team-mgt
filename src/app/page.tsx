import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">
        Swim Team Management System
      </h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">For Swimmers</h2>
          <p className="mb-4">
            Register for events in the active meet. Select which events you want to swim and enter your seed times.
          </p>
          <Link 
            href="/events" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
          >
            Register for Events
          </Link>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">For Coaches</h2>
          <p className="mb-4">
            Create meets, manage swimmers, create relay teams, and export meet files.
          </p>
          <div className="space-x-2 space-y-2">
            <Link 
              href="/meets" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
            >
              Manage Meets
            </Link>
            <Link 
              href="/swimmers" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
            >
              Manage Swimmers
            </Link>
            <Link 
              href="/relays" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
            >
              Create Relays
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Meet Management</h2>
        <p className="mb-4">
          Export swimmer entries and relay teams to Meet Manager format for use at swim meets.
        </p>
        <Link 
          href="/export" 
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Export to Meet Manager
        </Link>
      </div>
    </div>
  );
}

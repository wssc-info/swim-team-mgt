'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function Navigation() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Swim Team Management
        </Link>
        <div className="flex items-center space-x-4">
          {user.role === 'coach' && (
            <>
              <Link href="/meets" className="hover:underline">
                Meets
              </Link>
              <Link href="/swimmers" className="hover:underline">
                Swimmers
              </Link>
              <Link href="/times" className="hover:underline">
                Times
              </Link>
              <Link href="/relays" className="hover:underline">
                Relays
              </Link>
              <Link href="/export" className="hover:underline">
                Export
              </Link>
            </>
          )}
          <Link href="/events" className="hover:underline">
            Events
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-sm">
              {user.firstName} {user.lastName} ({user.role})
            </span>
            <button
              onClick={logout}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

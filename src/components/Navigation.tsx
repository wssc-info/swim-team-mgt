'use client';

import Link from 'next/link';
import {useAuth} from '@/lib/auth-context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navigation() {
    const {user, logout} = useAuth();

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
                    {(user.role === 'coach' || user.role === 'admin') && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger className={'hover:underline'}>Meet Setup</DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Link href="/meets" className="hover:underline flex-1">
                                            Meets
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Link href="/relays" className="hover:underline flex-1">
                                            Relay Setup
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem>
                                        <Link href="/export" className="hover:underline flex-1">
                                            Export
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem>
                                        <Link href="/times" className="hover:underline flex-1">
                                            Results/Times
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger className={'hover:backdrop-blur-3xl'}>Admin
                                    Functions</DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Link href="/admin/users" className="hover:underline flex-1">
                                            Admin Users
                                        </Link></DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Link href="/admin/swimmers" className="hover:underline flex-1">
                                            Swimmers
                                        </Link></DropdownMenuItem>
                                  {user.role === 'admin' && (
                                    <DropdownMenuItem>
                                      <Link href="/admin/clubs" className="hover:underline flex-1">
                                        Clubs
                                      </Link></DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
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

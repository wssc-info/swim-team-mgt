'use client';

import Link from 'next/link';
import {useAuth} from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";
import React, {ChangeEvent, useEffect, useState} from "react";
import {fetchClubs} from "@/lib/api";
import {SwimClub} from "@/lib/types";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export default function Navigation() {
  const {user, logout} = useAuth();
  const [clubs, setClubs] = useState<SwimClub[]>()

  const [activeClub, setActiveClub] = useState<string>()

  useEffect(()=>{
    if(user?.role === 'admin'){
      fetchClubs().then(setClubs);
      setActiveClub(localStorage.getItem('adminClubId') || '');
    }
  }, [user])

  const adminClubChange = (value: string)=> {
    if("---" === value){
      localStorage.removeItem('adminClubId')
    } else {
      localStorage.setItem('adminClubId', value);
    }
    window.location.reload();
  }

  if (!user) {
    // logout();
    return null;
  }


  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          <Image src={'/stm-logo-sm.png'} alt={'Swim Team Management Logo'}
                 width={60} height={60}
                 className="inline mr-5"
                 />
        </Link>
        <div className="flex items-center space-x-4">
          {(user.role === 'admin' && !!clubs) && (
            <>
              <Select value={activeClub || "---"}
                      onValueChange={adminClubChange}>
                <SelectTrigger className="ml-4 max-w-sm">
                  <SelectValue className="text-white" placeholder="Club to Use..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="---">No Club</SelectItem>
                  {
                    clubs.map((club) => {
                      return <SelectItem value={club.id} key={club.id}>{club.name}</SelectItem>
                    })
                  }
                </SelectContent>
              </Select>
            </>
          )}
          {(user.role === 'coach' || user.role === 'admin') && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className={'hover:underline hover:cursor-pointer'}>Meet Setup</DropdownMenuTrigger>
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
                <DropdownMenuTrigger className={'hover:underline cursor-pointer'}>Admin
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
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href="/admin/clubs" className="hover:underline flex-1">
                          Clubs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/admin/events" className="hover:underline flex-1">
                          Events
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Link href="/events" className="hover:underline cursor-pointer">
            Events
          </Link>
          {(user.role === 'family') && (
            <Link href="/my-swimmers" className="hover:underline cursor-pointer">
              Swimmer Times
            </Link>
          )}
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

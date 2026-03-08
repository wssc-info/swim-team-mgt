import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {Swimmer, User} from "@/lib/types";
import {AGE_UNDER_8, AGE_9_10, AGE_11_12, AGE_13_14, AGE_15_18} from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSwimmerExternalId(swimmer: Partial<Swimmer>): string {
  if (!swimmer.firstName || !swimmer.lastName || !swimmer.dateOfBirth) {
    throw new Error('First name, last name, and date of birth are required to generate external ID');
  }
  console.log('Generating external ID for swimmer:', swimmer);
    const dobParts = swimmer.dateOfBirth.split('-');
    const formattedDate = `${dobParts[0].slice(-2)}${dobParts[1].padStart(2, '0')}${dobParts[2].padStart(2, '0')}`;
    const externalId = formattedDate +
    swimmer.firstName.substring(0, 3).toUpperCase().padEnd(3, '*') +
    (swimmer.middleInitial || '*').substring(0, 1).toUpperCase() +
    swimmer.lastName.substring(0, 4).toUpperCase().padEnd(4, '*');
  console.log('Generated external ID:', externalId);
  return externalId;
}

export function calculateAgeGroup(dateOfBirth: string): string {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;

  if (actualAge <= 8) return AGE_UNDER_8;
  if (actualAge <= 10) return AGE_9_10;
  if (actualAge <= 12) return AGE_11_12;
  if (actualAge <= 14) return AGE_13_14;
  return AGE_15_18;
}

export function getClubId(user: Partial<User> | null): string{
  if(user?.clubId) {
    return user.clubId;
  }
  if(user?.role === "admin"){
    const clubId = localStorage.getItem('adminClubId');
    if (clubId) {
      return clubId;
    }
  }
  throw new Error("Unable to determine Club");
}

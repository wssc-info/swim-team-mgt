import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {Swimmer} from "@/lib/types";

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


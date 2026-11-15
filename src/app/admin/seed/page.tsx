'use client';

import { useState } from 'react';
import { createLeague, createClub, createSwimEvent, createMeetTemplate } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const MCSL_LEAGUE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const LEAGUES = [
  {
    id: MCSL_LEAGUE_ID,
    name: 'Madison Club Swim League',
    abbreviation: 'MCSL',
    description: 'Madison-area recreational swim league for club teams',
    isActive: true,
  },
];

const CLUBS = [
  { id: '4f180b21-0407-4c34-b23a-cc3b47e98f5e', name: 'Goodman', abbreviation: 'GMW', address: '325 West Olin Avenue', city: 'Madison', state: 'WI', zipCode: '53715', phone: '', email: '', website: 'http://goodmanwaves.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: '611fae73-daa2-48f2-9d60-3938a073cc49', name: 'Monona', abbreviation: 'MON', address: '1011 Nichols Road', city: 'Monona', state: 'WI', zipCode: '53716', phone: '', email: '', website: 'http://mononaswimanddive.org/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: '68318ddd-5e64-4c38-a9cd-a1231f63294b', name: 'High Point', abbreviation: 'HP', address: '901 North High Point Road', city: 'Madison', state: 'WI', zipCode: '53717', phone: '', email: '', website: 'http://highpointswimclub.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: '7051364b-fa98-42c3-b907-cf9909915e7c', name: 'Seminole', abbreviation: 'SEM', address: '5948 Schumann Drive', city: 'Madison', state: 'WI', zipCode: '53711', phone: '', email: '', website: 'http://seminolepool.org/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: '7c394526-7435-4e9f-bad9-4ffb8ff4831e', name: 'Shorewood Hills', abbreviation: 'SH', address: '901 Swarthmore Court', city: 'Madison', state: 'WI', zipCode: '53705', phone: '', email: '', website: 'http://shorewoodpool.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: '9ceca8c1-2c04-4623-99ef-96363c3a9edc', name: 'West Side Swim Club', abbreviation: 'MLWSSC', address: '5533 Odana Road', city: 'Madison', state: 'WI', zipCode: '53719', phone: '', email: '', website: 'http://www.westsideswimclub.com', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'a79c76d8-bfd2-4d78-888e-08573c1714b0', name: 'Hill Farm', abbreviation: 'HF', address: '2 North Eau Claire Avenue', city: 'Madison', state: 'WI', zipCode: '53705', phone: '', email: '', website: 'http://hillfarmherd.weebly.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'aac93692-2a3a-4624-ad1e-442699659f15', name: 'Nakoma', abbreviation: 'NK', address: '4145 Country Club Road', city: 'Madison', state: 'WI', zipCode: '53711', phone: '', email: '', website: 'http://nakomaswimanddive.org/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'bd755d31-09d0-44d7-bc79-aa3e6b88c3b4', name: 'Maple Bluff', abbreviation: 'MBM', address: '500 Kensington Drive', city: 'Madison', state: 'WI', zipCode: '53717', phone: '', email: '', website: 'https://www.teamunify.com/Home.jsp?team=recmacsdlmbcc', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'c1affab1-ad02-4c31-8131-2f81733711a4', name: 'Ridgewood', abbreviation: 'RWP', address: '5109 Barton Road', city: 'Madison', state: 'WI', zipCode: '53711', phone: '', email: '', website: 'http://www.ridgewoodpool.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'c20d18f2-5d52-49b5-ae4b-6d5eadda27bb', name: 'Parkcrest', abbreviation: 'P', address: '1 North Yellowstone Road', city: 'Madison', state: 'WI', zipCode: '53705', phone: '', email: '', website: 'http://parkcrestpool.org/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'd1705548-9293-46cc-8a3c-ecbd909cd9b8', name: 'Middleton Gators', abbreviation: 'MGSD', address: '2400 Park Lawn Place', city: 'Middleton', state: 'WI', zipCode: '53562', phone: '', email: '', website: 'http://middletongators.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
  { id: 'e4f3e630-f4b8-4920-8e88-c5f8d4de51e2', name: 'Hawks Landing', abbreviation: 'HL', address: '88 Hawks Landing Circle', city: 'Verona', state: 'WI', zipCode: '53593', phone: '', email: '', website: 'http://hawkslandinggolfclub.com/', isActive: true, leagueId: MCSL_LEAGUE_ID },
];

const EVENTS = [
  // SCY Freestyle
  { id: '25-free-scy', name: '25 Freestyle', distance: 25, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '50-free-scy', name: '50 Freestyle', distance: 50, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-free-scy', name: '100 Freestyle', distance: 100, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-scy', name: '200 Freestyle', distance: 200, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '500-free-scy', name: '500 Freestyle', distance: 500, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '1000-free-scy', name: '1000 Freestyle', distance: 1000, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '1650-free-scy', name: '1650 Freestyle', distance: 1650, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['15-18'], isActive: true },
  // SCM Freestyle
  { id: '25-free-scm', name: '25 Freestyle', distance: 25, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '50-free-scm', name: '50 Freestyle', distance: 50, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-free-scm', name: '100 Freestyle', distance: 100, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-scm', name: '200 Freestyle', distance: 200, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-scm', name: '400 Freestyle', distance: 400, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-scm', name: '800 Freestyle', distance: 800, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '1500-free-scm', name: '1500 Freestyle', distance: 1500, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['15-18'], isActive: true },
  // LCM Freestyle
  { id: '50-free-lcm', name: '50 Freestyle', distance: 50, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-free-lcm', name: '100 Freestyle', distance: 100, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-lcm', name: '200 Freestyle', distance: 200, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-lcm', name: '400 Freestyle', distance: 400, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-lcm', name: '800 Freestyle', distance: 800, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '1500-free-lcm', name: '1500 Freestyle', distance: 1500, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['15-18'], isActive: true },
  // SCY Backstroke
  { id: '25-back-scy', name: '25 Backstroke', distance: 25, stroke: 'backstroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-back-scy', name: '50 Backstroke', distance: 50, stroke: 'backstroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-back-scy', name: '100 Backstroke', distance: 100, stroke: 'backstroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-back-scy', name: '200 Backstroke', distance: 200, stroke: 'backstroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCM Backstroke
  { id: '25-back-scm', name: '25 Backstroke', distance: 25, stroke: 'backstroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-back-scm', name: '50 Backstroke', distance: 50, stroke: 'backstroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-back-scm', name: '100 Backstroke', distance: 100, stroke: 'backstroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-back-scm', name: '200 Backstroke', distance: 200, stroke: 'backstroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // LCM Backstroke
  { id: '50-back-lcm', name: '50 Backstroke', distance: 50, stroke: 'backstroke' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-back-lcm', name: '100 Backstroke', distance: 100, stroke: 'backstroke' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-back-lcm', name: '200 Backstroke', distance: 200, stroke: 'backstroke' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCY Breaststroke
  { id: '25-breast-scy', name: '25 Breaststroke', distance: 25, stroke: 'breaststroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-breast-scy', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-breast-scy', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-breast-scy', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCM Breaststroke
  { id: '25-breast-scm', name: '25 Breaststroke', distance: 25, stroke: 'breaststroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-breast-scm', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-breast-scm', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-breast-scm', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // LCM Breaststroke
  { id: '50-breast-lcm', name: '50 Breaststroke', distance: 50, stroke: 'breaststroke' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-breast-lcm', name: '100 Breaststroke', distance: 100, stroke: 'breaststroke' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-breast-lcm', name: '200 Breaststroke', distance: 200, stroke: 'breaststroke' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCY Butterfly
  { id: '25-fly-scy', name: '25 Butterfly', distance: 25, stroke: 'butterfly' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-fly-scy', name: '50 Butterfly', distance: 50, stroke: 'butterfly' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-fly-scy', name: '100 Butterfly', distance: 100, stroke: 'butterfly' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-fly-scy', name: '200 Butterfly', distance: 200, stroke: 'butterfly' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCM Butterfly
  { id: '25-fly-scm', name: '25 Butterfly', distance: 25, stroke: 'butterfly' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['8&U'], isActive: true },
  { id: '50-fly-scm', name: '50 Butterfly', distance: 50, stroke: 'butterfly' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-fly-scm', name: '100 Butterfly', distance: 100, stroke: 'butterfly' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-fly-scm', name: '200 Butterfly', distance: 200, stroke: 'butterfly' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // LCM Butterfly
  { id: '50-fly-lcm', name: '50 Butterfly', distance: 50, stroke: 'butterfly' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '100-fly-lcm', name: '100 Butterfly', distance: 100, stroke: 'butterfly' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '200-fly-lcm', name: '200 Butterfly', distance: 200, stroke: 'butterfly' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCY Individual Medley
  { id: '100-im-scy', name: '100 Individual Medley', distance: 100, stroke: 'medley' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-im-scy', name: '200 Individual Medley', distance: 200, stroke: 'medley' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '400-im-scy', name: '400 Individual Medley', distance: 400, stroke: 'medley' as const, course: 'SCY' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCM Individual Medley
  { id: '100-im-scm', name: '100 Individual Medley', distance: 100, stroke: 'medley' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['9-10', '11-12'], isActive: true },
  { id: '200-im-scm', name: '200 Individual Medley', distance: 200, stroke: 'medley' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '400-im-scm', name: '400 Individual Medley', distance: 400, stroke: 'medley' as const, course: 'SCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // LCM Individual Medley
  { id: '100-im-lcm', name: '100 Individual Medley', distance: 100, stroke: 'medley' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['9-10', '11-12'], isActive: true },
  { id: '200-im-lcm', name: '200 Individual Medley', distance: 200, stroke: 'medley' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '400-im-lcm', name: '400 Individual Medley', distance: 400, stroke: 'medley' as const, course: 'LCM' as const, isRelay: false, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCY Relays
  { id: '100-free-relay-scy', name: '100 Freestyle Relay', distance: 100, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-relay-scy', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-relay-scy', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-relay-scy', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '100-medley-relay-scy', name: '100 Medley Relay', distance: 100, stroke: 'medley' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-medley-relay-scy', name: '200 Medley Relay', distance: 200, stroke: 'medley' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-medley-relay-scy', name: '400 Medley Relay', distance: 400, stroke: 'medley' as const, course: 'SCY' as const, isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  // SCM Relays
  { id: '100-free-relay-scm', name: '100 Freestyle Relay', distance: 100, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-relay-scm', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-relay-scm', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-relay-scm', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '100-medley-relay-scm', name: '100 Medley Relay', distance: 100, stroke: 'medley' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-medley-relay-scm', name: '200 Medley Relay', distance: 200, stroke: 'medley' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-medley-relay-scm', name: '400 Medley Relay', distance: 400, stroke: 'medley' as const, course: 'SCM' as const, isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  // LCM Relays
  { id: '100-free-relay-lcm', name: '100 Freestyle Relay', distance: 100, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-free-relay-lcm', name: '200 Freestyle Relay', distance: 200, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-free-relay-lcm', name: '400 Freestyle Relay', distance: 400, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['11-12', '13-14', '15-18'], isActive: true },
  { id: '800-free-relay-lcm', name: '800 Freestyle Relay', distance: 800, stroke: 'freestyle' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
  { id: '100-medley-relay-lcm', name: '100 Medley Relay', distance: 100, stroke: 'medley' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['8&U', '9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '200-medley-relay-lcm', name: '200 Medley Relay', distance: 200, stroke: 'medley' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['9-10', '11-12', '13-14', '15-18'], isActive: true },
  { id: '400-medley-relay-lcm', name: '400 Medley Relay', distance: 400, stroke: 'medley' as const, course: 'LCM' as const, isRelay: true, ageGroups: ['13-14', '15-18'], isActive: true },
];

const TEMPLATES = [
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'MCSL Standard Dual Meet',
    description: 'Madison Club Swim League standard dual-meet event order (SCY)',
    scope: 'league' as const,
    leagueId: MCSL_LEAGUE_ID,
    course: 'SCY' as const,
    availableEvents: [
      '100-medley-relay-scy', '200-medley-relay-scy',
      '25-free-scy', '50-free-scy', '100-free-scy',
      '25-back-scy', '50-back-scy', '100-back-scy',
      '100-free-relay-scy', '200-free-relay-scy',
      '100-im-scy', '200-im-scy',
      '25-breast-scy', '50-breast-scy', '100-breast-scy',
      '25-fly-scy', '50-fly-scy', '100-fly-scy',
    ],
    meetEvents: [
      { eventId: '100-medley-relay-scy', eventNumber: 1,  gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-medley-relay-scy', eventNumber: 2,  gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-medley-relay-scy', eventNumber: 3,  gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scy', eventNumber: 4,  gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scy', eventNumber: 5,  gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scy', eventNumber: 6,  gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scy', eventNumber: 7,  gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scy', eventNumber: 8,  gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scy', eventNumber: 9,  gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-medley-relay-scy', eventNumber: 10, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-free-scy',  eventNumber: 11, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-free-scy',  eventNumber: 12, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-free-scy',  eventNumber: 13, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-free-scy',  eventNumber: 14, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-free-scy',  eventNumber: 15, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-free-scy',  eventNumber: 16, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-free-scy', eventNumber: 17, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-free-scy', eventNumber: 18, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-free-scy', eventNumber: 19, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-free-scy', eventNumber: 20, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-back-scy',  eventNumber: 21, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-back-scy',  eventNumber: 22, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-back-scy',  eventNumber: 23, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-back-scy',  eventNumber: 24, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-back-scy',  eventNumber: 25, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-back-scy',  eventNumber: 26, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-back-scy', eventNumber: 27, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-back-scy', eventNumber: 28, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-back-scy', eventNumber: 29, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-back-scy', eventNumber: 30, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-free-relay-scy', eventNumber: 31, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-free-relay-scy', eventNumber: 32, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '100-im-scy', eventNumber: 33, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '100-im-scy', eventNumber: 34, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '100-im-scy', eventNumber: 35, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '100-im-scy', eventNumber: 36, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-im-scy', eventNumber: 37, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-im-scy', eventNumber: 38, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-im-scy', eventNumber: 39, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-im-scy', eventNumber: 40, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-breast-scy',  eventNumber: 41, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-breast-scy',  eventNumber: 42, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-breast-scy',  eventNumber: 43, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scy',  eventNumber: 44, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scy',  eventNumber: 45, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-breast-scy',  eventNumber: 46, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-breast-scy', eventNumber: 47, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scy', eventNumber: 48, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scy', eventNumber: 49, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-breast-scy', eventNumber: 50, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-fly-scy',  eventNumber: 51, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-fly-scy',  eventNumber: 52, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-fly-scy',  eventNumber: 53, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scy',  eventNumber: 54, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scy',  eventNumber: 55, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scy',  eventNumber: 56, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scy',  eventNumber: 57, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '50-fly-scy',  eventNumber: 58, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-fly-scy', eventNumber: 59, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-fly-scy', eventNumber: 60, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-im-scy', eventNumber: 61, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-im-scy', eventNumber: 62, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-free-relay-scy', eventNumber: 63, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scy', eventNumber: 64, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scy', eventNumber: 65, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scy', eventNumber: 66, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scy', eventNumber: 67, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scy', eventNumber: 68, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scy', eventNumber: 69, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-free-relay-scy', eventNumber: 70, gender: 'M' as const, ageGroup: '15-18' },
    ],
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    name: 'MCSL All-City Championship',
    description: 'Madison Club Swim League All-City Championship — standard events plus 15-18 100 IM, 15-18 50 Fly, and Open events',
    scope: 'league' as const,
    leagueId: MCSL_LEAGUE_ID,
    course: 'SCY' as const,
    availableEvents: [
      '100-medley-relay-scy', '200-medley-relay-scy',
      '25-free-scy', '50-free-scy', '100-free-scy',
      '25-back-scy', '50-back-scy', '100-back-scy',
      '100-free-relay-scy', '200-free-relay-scy',
      '100-im-scy', '200-im-scy',
      '25-breast-scy', '50-breast-scy', '100-breast-scy',
      '25-fly-scy', '50-fly-scy', '100-fly-scy',
    ],
    meetEvents: [
      { eventId: '100-medley-relay-scy', eventNumber: 1,  gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-medley-relay-scy', eventNumber: 2,  gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-medley-relay-scy', eventNumber: 3,  gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scy', eventNumber: 4,  gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scy', eventNumber: 5,  gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scy', eventNumber: 6,  gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scy', eventNumber: 7,  gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scy', eventNumber: 8,  gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scy', eventNumber: 9,  gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-medley-relay-scy', eventNumber: 10, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-free-scy',  eventNumber: 11, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-free-scy',  eventNumber: 12, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-free-scy',  eventNumber: 13, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-free-scy',  eventNumber: 14, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-free-scy',  eventNumber: 15, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-free-scy',  eventNumber: 16, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-free-scy', eventNumber: 17, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-free-scy', eventNumber: 18, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-free-scy', eventNumber: 19, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-free-scy', eventNumber: 20, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-back-scy',  eventNumber: 21, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-back-scy',  eventNumber: 22, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-back-scy',  eventNumber: 23, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-back-scy',  eventNumber: 24, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-back-scy',  eventNumber: 25, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-back-scy',  eventNumber: 26, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-back-scy', eventNumber: 27, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-back-scy', eventNumber: 28, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-back-scy', eventNumber: 29, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-back-scy', eventNumber: 30, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-free-relay-scy', eventNumber: 31, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-free-relay-scy', eventNumber: 32, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '100-im-scy', eventNumber: 33, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '100-im-scy', eventNumber: 34, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '100-im-scy', eventNumber: 35, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '100-im-scy', eventNumber: 36, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-im-scy', eventNumber: 37, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-im-scy', eventNumber: 38, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-im-scy', eventNumber: 39, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-im-scy', eventNumber: 40, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-breast-scy',  eventNumber: 41, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-breast-scy',  eventNumber: 42, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-breast-scy',  eventNumber: 43, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scy',  eventNumber: 44, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scy',  eventNumber: 45, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-breast-scy',  eventNumber: 46, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-breast-scy', eventNumber: 47, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scy', eventNumber: 48, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scy', eventNumber: 49, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-breast-scy', eventNumber: 50, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-fly-scy',  eventNumber: 51, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-fly-scy',  eventNumber: 52, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-fly-scy',  eventNumber: 53, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scy',  eventNumber: 54, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scy',  eventNumber: 55, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scy',  eventNumber: 56, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scy',  eventNumber: 57, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '50-fly-scy',  eventNumber: 58, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-fly-scy', eventNumber: 59, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-fly-scy', eventNumber: 60, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-im-scy', eventNumber: 61, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-im-scy', eventNumber: 62, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-free-relay-scy', eventNumber: 63, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scy', eventNumber: 64, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scy', eventNumber: 65, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scy', eventNumber: 66, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scy', eventNumber: 67, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scy', eventNumber: 68, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scy', eventNumber: 69, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-free-relay-scy', eventNumber: 70, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-im-scy', eventNumber: 139, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-im-scy', eventNumber: 140, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '50-fly-scy', eventNumber: 159, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '50-fly-scy', eventNumber: 160, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-free-scy', eventNumber: 211, gender: 'F' as const, ageGroup: 'Open' },
      { eventId: '25-free-scy', eventNumber: 212, gender: 'M' as const, ageGroup: 'Open' },
      { eventId: '50-free-scy', eventNumber: 213, gender: 'F' as const, ageGroup: 'Open' },
      { eventId: '50-free-scy', eventNumber: 214, gender: 'M' as const, ageGroup: 'Open' },
      { eventId: '25-back-scy', eventNumber: 221, gender: 'F' as const, ageGroup: 'Open' },
      { eventId: '25-back-scy', eventNumber: 222, gender: 'M' as const, ageGroup: 'Open' },
    ],
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    name: 'MCSL Standard Dual Meet (SCM)',
    description: 'Madison Club Swim League standard dual-meet event order (Short Course Meters)',
    scope: 'league' as const,
    leagueId: MCSL_LEAGUE_ID,
    course: 'SCM' as const,
    availableEvents: [
      '100-medley-relay-scm', '200-medley-relay-scm',
      '25-free-scm', '50-free-scm', '100-free-scm',
      '25-back-scm', '50-back-scm', '100-back-scm',
      '100-free-relay-scm', '200-free-relay-scm',
      '100-im-scm', '200-im-scm',
      '25-breast-scm', '50-breast-scm', '100-breast-scm',
      '25-fly-scm', '50-fly-scm', '100-fly-scm',
    ],
    meetEvents: [
      { eventId: '100-medley-relay-scm', eventNumber: 1,  gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-medley-relay-scm', eventNumber: 2,  gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-medley-relay-scm', eventNumber: 3,  gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scm', eventNumber: 4,  gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scm', eventNumber: 5,  gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scm', eventNumber: 6,  gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scm', eventNumber: 7,  gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scm', eventNumber: 8,  gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scm', eventNumber: 9,  gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-medley-relay-scm', eventNumber: 10, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-free-scm',  eventNumber: 11, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-free-scm',  eventNumber: 12, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-free-scm',  eventNumber: 13, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-free-scm',  eventNumber: 14, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-free-scm',  eventNumber: 15, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-free-scm',  eventNumber: 16, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-free-scm', eventNumber: 17, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-free-scm', eventNumber: 18, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-free-scm', eventNumber: 19, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-free-scm', eventNumber: 20, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-back-scm',  eventNumber: 21, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-back-scm',  eventNumber: 22, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-back-scm',  eventNumber: 23, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-back-scm',  eventNumber: 24, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-back-scm',  eventNumber: 25, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-back-scm',  eventNumber: 26, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-back-scm', eventNumber: 27, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-back-scm', eventNumber: 28, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-back-scm', eventNumber: 29, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-back-scm', eventNumber: 30, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-free-relay-scm', eventNumber: 31, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-free-relay-scm', eventNumber: 32, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '100-im-scm', eventNumber: 33, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '100-im-scm', eventNumber: 34, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '100-im-scm', eventNumber: 35, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '100-im-scm', eventNumber: 36, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-im-scm', eventNumber: 37, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-im-scm', eventNumber: 38, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-im-scm', eventNumber: 39, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-im-scm', eventNumber: 40, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-breast-scm',  eventNumber: 41, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-breast-scm',  eventNumber: 42, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-breast-scm',  eventNumber: 43, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scm',  eventNumber: 44, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scm',  eventNumber: 45, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-breast-scm',  eventNumber: 46, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-breast-scm', eventNumber: 47, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scm', eventNumber: 48, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scm', eventNumber: 49, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-breast-scm', eventNumber: 50, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-fly-scm',  eventNumber: 51, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-fly-scm',  eventNumber: 52, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-fly-scm',  eventNumber: 53, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scm',  eventNumber: 54, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scm',  eventNumber: 55, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scm',  eventNumber: 56, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scm',  eventNumber: 57, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '50-fly-scm',  eventNumber: 58, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-fly-scm', eventNumber: 59, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-fly-scm', eventNumber: 60, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-im-scm', eventNumber: 61, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-im-scm', eventNumber: 62, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-free-relay-scm', eventNumber: 63, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scm', eventNumber: 64, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scm', eventNumber: 65, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scm', eventNumber: 66, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scm', eventNumber: 67, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scm', eventNumber: 68, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scm', eventNumber: 69, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-free-relay-scm', eventNumber: 70, gender: 'M' as const, ageGroup: '15-18' },
    ],
  },
  {
    id: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
    name: 'MCSL All-City Championship (SCM)',
    description: 'Madison Club Swim League All-City Championship — standard events plus 15-18 100 IM, 15-18 50 Fly, and Open events (Short Course Meters)',
    scope: 'league' as const,
    leagueId: MCSL_LEAGUE_ID,
    course: 'SCM' as const,
    availableEvents: [
      '100-medley-relay-scm', '200-medley-relay-scm',
      '25-free-scm', '50-free-scm', '100-free-scm',
      '25-back-scm', '50-back-scm', '100-back-scm',
      '100-free-relay-scm', '200-free-relay-scm',
      '100-im-scm', '200-im-scm',
      '25-breast-scm', '50-breast-scm', '100-breast-scm',
      '25-fly-scm', '50-fly-scm', '100-fly-scm',
    ],
    meetEvents: [
      { eventId: '100-medley-relay-scm', eventNumber: 1,  gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-medley-relay-scm', eventNumber: 2,  gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-medley-relay-scm', eventNumber: 3,  gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scm', eventNumber: 4,  gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-medley-relay-scm', eventNumber: 5,  gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scm', eventNumber: 6,  gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-medley-relay-scm', eventNumber: 7,  gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scm', eventNumber: 8,  gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-medley-relay-scm', eventNumber: 9,  gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-medley-relay-scm', eventNumber: 10, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-free-scm',  eventNumber: 11, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-free-scm',  eventNumber: 12, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-free-scm',  eventNumber: 13, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-free-scm',  eventNumber: 14, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-free-scm',  eventNumber: 15, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-free-scm',  eventNumber: 16, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-free-scm', eventNumber: 17, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-free-scm', eventNumber: 18, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-free-scm', eventNumber: 19, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-free-scm', eventNumber: 20, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-back-scm',  eventNumber: 21, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-back-scm',  eventNumber: 22, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-back-scm',  eventNumber: 23, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-back-scm',  eventNumber: 24, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-back-scm',  eventNumber: 25, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-back-scm',  eventNumber: 26, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-back-scm', eventNumber: 27, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-back-scm', eventNumber: 28, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-back-scm', eventNumber: 29, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-back-scm', eventNumber: 30, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-free-relay-scm', eventNumber: 31, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-free-relay-scm', eventNumber: 32, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '100-im-scm', eventNumber: 33, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '100-im-scm', eventNumber: 34, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '100-im-scm', eventNumber: 35, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '100-im-scm', eventNumber: 36, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-im-scm', eventNumber: 37, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-im-scm', eventNumber: 38, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-im-scm', eventNumber: 39, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-im-scm', eventNumber: 40, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-breast-scm',  eventNumber: 41, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-breast-scm',  eventNumber: 42, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-breast-scm',  eventNumber: 43, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scm',  eventNumber: 44, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-breast-scm',  eventNumber: 45, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-breast-scm',  eventNumber: 46, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '100-breast-scm', eventNumber: 47, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scm', eventNumber: 48, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-breast-scm', eventNumber: 49, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-breast-scm', eventNumber: 50, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-fly-scm',  eventNumber: 51, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '25-fly-scm',  eventNumber: 52, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '50-fly-scm',  eventNumber: 53, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scm',  eventNumber: 54, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '50-fly-scm',  eventNumber: 55, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scm',  eventNumber: 56, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '50-fly-scm',  eventNumber: 57, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '50-fly-scm',  eventNumber: 58, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '100-fly-scm', eventNumber: 59, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-fly-scm', eventNumber: 60, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-im-scm', eventNumber: 61, gender: 'F' as const, ageGroup: '8&U' },
      { eventId: '100-im-scm', eventNumber: 62, gender: 'M' as const, ageGroup: '8&U' },
      { eventId: '200-free-relay-scm', eventNumber: 63, gender: 'F' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scm', eventNumber: 64, gender: 'M' as const, ageGroup: '9-10' },
      { eventId: '200-free-relay-scm', eventNumber: 65, gender: 'F' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scm', eventNumber: 66, gender: 'M' as const, ageGroup: '11-12' },
      { eventId: '200-free-relay-scm', eventNumber: 67, gender: 'F' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scm', eventNumber: 68, gender: 'M' as const, ageGroup: '13-14' },
      { eventId: '200-free-relay-scm', eventNumber: 69, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '200-free-relay-scm', eventNumber: 70, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '100-im-scm', eventNumber: 139, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '100-im-scm', eventNumber: 140, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '50-fly-scm', eventNumber: 159, gender: 'F' as const, ageGroup: '15-18' },
      { eventId: '50-fly-scm', eventNumber: 160, gender: 'M' as const, ageGroup: '15-18' },
      { eventId: '25-free-scm', eventNumber: 211, gender: 'F' as const, ageGroup: 'Open' },
      { eventId: '25-free-scm', eventNumber: 212, gender: 'M' as const, ageGroup: 'Open' },
      { eventId: '50-free-scm', eventNumber: 213, gender: 'F' as const, ageGroup: 'Open' },
      { eventId: '50-free-scm', eventNumber: 214, gender: 'M' as const, ageGroup: 'Open' },
      { eventId: '25-back-scm', eventNumber: 221, gender: 'F' as const, ageGroup: 'Open' },
      { eventId: '25-back-scm', eventNumber: 222, gender: 'M' as const, ageGroup: 'Open' },
    ],
  },
];

type SeedResult = { name: string; status: 'pending' | 'ok' | 'error'; message?: string };

function SeedSection({
  title, count, results, running, done, onRun,
}: {
  title: string; count: number; results: SeedResult[];
  running: boolean; done: boolean; onRun: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">{count} records</p>
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {running ? 'Seeding...' : 'Seed'}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="space-y-0.5 font-mono text-xs max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={r.status === 'ok' ? 'text-green-600' : r.status === 'error' ? 'text-red-500' : 'text-gray-400'}>
                {r.status === 'ok' ? '✓' : r.status === 'error' ? '✗' : '…'}
              </span>
              <span className="truncate">{r.name}</span>
              {r.message && <span className="text-red-400 truncate">{r.message}</span>}
            </li>
          ))}
        </ul>
      )}
      {done && (
        <p className="mt-2 text-sm font-medium text-green-700">
          Done — {results.filter(r => r.status === 'ok').length} created,{' '}
          {results.filter(r => r.status === 'error').length} errors
        </p>
      )}
    </div>
  );
}

export default function SeedPage() {
  const [leagueResults, setLeagueResults] = useState<SeedResult[]>([]);
  const [leagueRunning, setLeagueRunning] = useState(false);
  const [leagueDone, setLeagueDone] = useState(false);

  const [clubResults, setClubResults] = useState<SeedResult[]>([]);
  const [clubRunning, setClubRunning] = useState(false);
  const [clubDone, setClubDone] = useState(false);

  const [eventResults, setEventResults] = useState<SeedResult[]>([]);
  const [eventRunning, setEventRunning] = useState(false);
  const [eventDone, setEventDone] = useState(false);

  const [templateResults, setTemplateResults] = useState<SeedResult[]>([]);
  const [templateRunning, setTemplateRunning] = useState(false);
  const [templateDone, setTemplateDone] = useState(false);

  const runLeagueSeed = async () => {
    setLeagueRunning(true); setLeagueDone(false);
    setLeagueResults(LEAGUES.map(l => ({ name: l.name, status: 'pending' })));
    for (let i = 0; i < LEAGUES.length; i++) {
      try {
        await createLeague(LEAGUES[i]);
        setLeagueResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'ok' } : r));
      } catch (err) {
        setLeagueResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: String(err) } : r));
      }
    }
    setLeagueRunning(false); setLeagueDone(true);
  };

  const runClubSeed = async () => {
    setClubRunning(true); setClubDone(false);
    setClubResults(CLUBS.map(c => ({ name: c.name, status: 'pending' })));
    for (let i = 0; i < CLUBS.length; i++) {
      try {
        await createClub(CLUBS[i]);
        setClubResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'ok' } : r));
      } catch (err) {
        setClubResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: String(err) } : r));
      }
    }
    setClubRunning(false); setClubDone(true);
  };

  const runEventSeed = async () => {
    setEventRunning(true); setEventDone(false);
    setEventResults(EVENTS.map(e => ({ name: e.id, status: 'pending' })));
    for (let i = 0; i < EVENTS.length; i++) {
      try {
        await createSwimEvent(EVENTS[i]);
        setEventResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'ok' } : r));
      } catch (err) {
        setEventResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: String(err) } : r));
      }
    }
    setEventRunning(false); setEventDone(true);
  };

  const runTemplateSeed = async () => {
    setTemplateRunning(true); setTemplateDone(false);
    setTemplateResults(TEMPLATES.map(t => ({ name: t.name, status: 'pending' })));
    for (let i = 0; i < TEMPLATES.length; i++) {
      try {
        await createMeetTemplate(TEMPLATES[i]);
        setTemplateResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'ok' } : r));
      } catch (err) {
        setTemplateResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: String(err) } : r));
      }
    }
    setTemplateRunning(false); setTemplateDone(true);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Seed Data</h1>
        <p className="text-gray-600 mb-6">
          Populate the database with initial data. Seed Leagues first, then Clubs (clubs reference leagues).
          Safe to re-run — existing records will show as errors (which is fine).
        </p>
        <SeedSection title="Leagues" count={LEAGUES.length} results={leagueResults} running={leagueRunning} done={leagueDone} onRun={runLeagueSeed} />
        <SeedSection title="Swim Clubs" count={CLUBS.length} results={clubResults} running={clubRunning} done={clubDone} onRun={runClubSeed} />
        <SeedSection title="Swim Events (USA Swimming)" count={EVENTS.length} results={eventResults} running={eventRunning} done={eventDone} onRun={runEventSeed} />
        <SeedSection title="Meet Templates (MCSL)" count={TEMPLATES.length} results={templateResults} running={templateRunning} done={templateDone} onRun={runTemplateSeed} />
      </div>
    </ProtectedRoute>
  );
}

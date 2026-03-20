import {MeetEvent, Swimmer} from '@/lib/types';
import {timeToSdifFormat, getStrokeCode, getCourseCode, getAgeCode} from '../utils';
import {SwimEventModel} from "@/lib/models";

// D3 -- Individual Information Record
// start/start
// length   Mand   Type    Description
// ----------------------------------------------------------------
// 1/2      M1     CONST   "D3"
// 3/14     M2     USSNUM  USS# (new)
// 17/15           ALPHA   preferred first name
// 32/2      *     CODE    ethnicity code 026
// 34/1      *     LOGICAL Junior High School
// 35/1      *     LOGICAL Senior High School
// 36/1      *     LOGICAL YMCA/YWCA
// 37/1      *     LOGICAL College
// 38/1      *     LOGICAL Summer Swim League
// 39/1      *     LOGICAL Masters
// 40/1      *     LOGICAL Disabled Sports Organizations
// 41/1      *     LOGICAL Water Polo
// 42/1      *     LOGICAL None
// 43/118                  future use
export class D3Record {
  static generate(swimmer: Swimmer): string {
    const ussNumber = (swimmer.externalId || swimmer.id).substring(0, 14).padEnd(14, ' '); // positions 3-16
    const firstName = swimmer.firstName.padEnd(20, ' ').substring(0, 20);
    const ethnicityCode = ''.padEnd(2, ' '); // positions 32-33
    const JuniorHighSchool = 'F';
    const SeniorHighSchool = 'F';
    const YMCA_YWCA = 'F';
    const College = 'F';
    const SummerSwimLeague = 'T';
    const Masters = 'F';
    const DisabledSportsOrganizations = 'F';
    const WaterPolo = 'F';
    const None = 'F';
    const futureUseD3 = ''.padEnd(118, ' '); // positions 43-160

    return `D3${ussNumber}${firstName}${ethnicityCode}${JuniorHighSchool}${SeniorHighSchool}${YMCA_YWCA}${College}${SummerSwimLeague}${Masters}${DisabledSportsOrganizations}${WaterPolo}${None}${futureUseD3}\n`;
  }
}

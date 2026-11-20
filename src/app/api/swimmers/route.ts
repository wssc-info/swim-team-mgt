import { NextRequest, NextResponse } from 'next/server';
import { SwimmerService } from '@/lib/services/swimmer-service';
import {AuthService} from "@/lib/services/auth-service";
import {UserModel} from "@/lib/models";

const swimmerService = SwimmerService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const user: UserModel | null = await AuthService.getInstance().getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const clubId = searchParams.get('clubId');
    // Only admins/leagueAdmins/coaches may request inactive swimmers
    const canSeeInactive = user.role === 'admin' || user.role === 'leagueAdmin' || user.role === 'coach';
    const showInactive = canSeeInactive && searchParams.get('showInactive') === 'true';

    // Family users always see only their associated swimmers, regardless of params
    if (user.role === 'family') {
      const swimmers = await swimmerService.getAssociatedSwimmers(user.id, ['approved', 'pending']);
      return NextResponse.json(swimmers);
    }

    if (userId) {
      // Only admins/coaches/leagueAdmins may look up another user's associated swimmers
      if (user.role !== 'admin' && user.role !== 'leagueAdmin' && user.role !== 'coach') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const swimmers = await swimmerService.getAssociatedSwimmers(userId);
      return NextResponse.json(swimmers);
    } else if (clubId) {
      // Only admins/leagueAdmins can query any club; others are restricted to their own club
      if (user.role !== 'admin' && user.role !== 'leagueAdmin' && clubId !== user.clubId) {
        return NextResponse.json({ error: 'You can only access swimmers from your own club' }, { status: 403 });
      }
      const swimmers = await swimmerService.getSwimmers(clubId, showInactive ? undefined : true);
      return NextResponse.json(swimmers);
    } else {
      // No clubId supplied — default to the user's club
      const swimmers = await swimmerService.getSwimmers(user.clubId, showInactive ? undefined : true);
      return NextResponse.json(swimmers);
    }
  } catch (error) {
    console.error('Error fetching swimmers:', error);
    return NextResponse.json({ error: 'Failed to fetch swimmers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user: UserModel | null = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'leagueAdmin' && user.role !== 'coach')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, dateOfBirth, gender, clubId } = body;

    if (!firstName || !lastName || !dateOfBirth || !gender || !clubId) {
      return NextResponse.json({ error: 'All fields including club are required' }, { status: 400 });
    }

    // Non-admins can only create swimmers for their own club
    if (user.role !== 'admin' && user.role !== 'leagueAdmin' && clubId !== user.clubId) {
      return NextResponse.json({ error: 'You can only add swimmers to your own club' }, { status: 403 });
    }

    const swimmer = await swimmerService.addSwimmer(body);
    return NextResponse.json(swimmer);
  } catch (error) {
    console.error('Error adding swimmer:', error);
    return NextResponse.json({ error: 'Failed to add swimmer' }, { status: 500 });
  }
}

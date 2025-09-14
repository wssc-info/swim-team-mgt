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
    
    if (userId) {
      // Fetch swimmers associated with the specific user (family)
      const swimmers = await swimmerService.getAssociatedSwimmers(userId);
      return NextResponse.json(swimmers);
    } else if (clubId) {
      // Fetch swimmers for a specific club
      // Only admins can query any club, others can only query their own club
      if (user.role !== 'admin' && clubId !== user.clubId) {
        return NextResponse.json({ error: 'You can only access swimmers from your own club' }, { status: 403 });
      }
      const swimmers = await swimmerService.getSwimmers(clubId);
      return NextResponse.json(swimmers);
    } else {
      // Fetch all swimmers (for coaches) - defaults to user's club
      const swimmers = await swimmerService.getSwimmers(user.clubId);
      return NextResponse.json(swimmers);
    }
  } catch (error) {
    console.error('Error fetching swimmers:', error);
    return NextResponse.json({ error: 'Failed to fetch swimmers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, dateOfBirth, gender, clubId } = body;
    
    if (!firstName || !lastName || !dateOfBirth || !gender || !clubId) {
      return NextResponse.json({ error: 'All fields including club are required' }, { status: 400 });
    }
    
    const swimmer = await swimmerService.addSwimmer(body);
    return NextResponse.json(swimmer);
  } catch (error) {
    console.error('Error adding swimmer:', error);
    return NextResponse.json({ error: 'Failed to add swimmer' }, { status: 500 });
  }
}

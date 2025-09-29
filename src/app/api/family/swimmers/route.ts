import { NextRequest, NextResponse } from 'next/server';
import {UserModel} from "@/lib/models";
import {AuthService} from "@/lib/services/auth-service";
import {SwimmerService} from "@/lib/services/swimmer-service";

const swimmerService = SwimmerService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const user: UserModel | null = await AuthService.getInstance().getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in.' }, { status: 401 });
    }
    if (user.role !== 'family') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const swimmers = await swimmerService.getAssociatedSwimmers(user.id);

    return NextResponse.json(swimmers);
  } catch (error) {
    console.error('Error fetching family swimmers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { SwimmerService } from '@/lib/services/swimmer-service';
import {AuthService} from "@/lib/services/auth-service";
import {UserModel} from "@/lib/models";

const swimmerService = SwimmerService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { swimmerIds, activeFlag } = body;
    
    if (!Array.isArray(swimmerIds) || typeof activeFlag !== 'boolean') {
      return NextResponse.json({ error: 'swimmerIds must be an array and activeFlag must be a boolean' }, { status: 400 });
    }

    await Promise.all(
      swimmerIds.map(
        (swimmerId: string) => {
            return swimmerService.updateSwimmer(swimmerId, { active: activeFlag });
        }
      ),
    );

    return NextResponse.json("done");
  } catch (error) {
    console.error('Error adding swimmer:', error);
    return NextResponse.json({ error: 'Failed to add swimmer' }, { status: 500 });
  }
}

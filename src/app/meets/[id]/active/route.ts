import { NextRequest, NextResponse } from 'next/server';
import { SwimClubModel, MeetModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const { id: meetId } = await params;
    const body = await request.json();
    const { clubId: requestedClubId } = body;
    
    const user = await AuthService.getInstance().getUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find the meet
    const meet = await MeetModel.findByPk(meetId);
    if (!meet) {
      return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
    }

    // Determine which club should have this as active meet
    let targetClubId = requestedClubId || meet.clubId;
    
    // If no specific club requested, determine based on user's club
    if (!requestedClubId) {
      if (user.clubId === meet.againstClubId) {
        targetClubId = meet.againstClubId;
      } else {
        targetClubId = meet.clubId;
      }
    }

    // Validate that the meet involves the target club
    if (targetClubId !== meet.clubId && targetClubId !== meet.againstClubId) {
      return NextResponse.json({ 
        error: 'Club is not involved in this meet' 
      }, { status: 400 });
    }

    // Check if user has access to set active meet for this club
    if (user.role === 'coach' && user.clubId !== targetClubId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const club = await SwimClubModel.findByPk(targetClubId);
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Set this meet as the active meet for the club
    await club.update({ activeMeetId: meetId });

    return NextResponse.json({ 
      message: 'Meet set as active successfully',
      clubId: targetClubId,
      meetId: meetId
    });
  } catch (error) {
    console.error('Error setting active meet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    
    const { id: meetId } = await params;
    const user = await AuthService.getInstance().getUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find clubs that have this meet as active and clear it
    const clubs = await SwimClubModel.findAll({
      where: { activeMeetId: meetId }
    });

    for (const club of clubs) {
      // Check if user has access to this club
      if (user.role === 'coach' && user.clubId !== club.id) {
        continue; // Skip clubs the user doesn't have access to
      }
      
      await club.update({ activeMeetId: null });
    }

    return NextResponse.json({ 
      message: 'Meet deactivated successfully',
      affectedClubs: clubs.length
    });
  } catch (error) {
    console.error('Error deactivating meet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

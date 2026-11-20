import { NextRequest, NextResponse } from 'next/server';
import { Op } from 'sequelize';
import {
  SwimmerModel,
  TimeRecordModel,
  SwimmerMeetEventModel,
  FamilySwimmerAssociationModel,
  RelayTeamModel,
  initializeDatabase,
} from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'coach' && user.role !== 'admin' && user.role !== 'leagueAdmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceId, targetId } = await request.json();

    if (!sourceId || !targetId || sourceId === targetId) {
      return NextResponse.json({ error: 'sourceId and targetId are required and must differ' }, { status: 400 });
    }

    const [source, target] = await Promise.all([
      SwimmerModel.findByPk(sourceId),
      SwimmerModel.findByPk(targetId),
    ]);

    if (!source || !target) {
      return NextResponse.json({ error: 'One or both swimmers not found' }, { status: 404 });
    }

    // Coaches can only merge swimmers from their club
    if (user.role === 'coach') {
      if (source.clubId !== user.clubId || target.clubId !== user.clubId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Move time records
    const movedTimes = await TimeRecordModel.update(
      { swimmerId: targetId },
      { where: { swimmerId: sourceId } }
    );

    // Move swimmer-meet-event registrations (avoid duplicates for same event in same meet)
    const sourceEvents = await SwimmerMeetEventModel.findAll({ where: { swimmerId: sourceId } });
    for (const evt of sourceEvents) {
      const duplicate = await SwimmerMeetEventModel.findOne({
        where: { swimmerId: targetId, meetId: evt.meetId, eventId: evt.eventId },
      });
      if (!duplicate) {
        await evt.update({ swimmerId: targetId });
      } else {
        await evt.destroy();
      }
    }

    // Move family associations (avoid duplicates)
    const sourceAssocs = await FamilySwimmerAssociationModel.findAll({ where: { swimmerId: sourceId } });
    for (const assoc of sourceAssocs) {
      const duplicate = await FamilySwimmerAssociationModel.findOne({
        where: { userId: assoc.userId, swimmerId: targetId },
      });
      if (!duplicate) {
        await assoc.update({ swimmerId: targetId });
      } else {
        await assoc.destroy();
      }
    }

    // Update relay teams — swimmers stored as JSON array of IDs
    const relayTeams = await RelayTeamModel.findAll();
    for (const relay of relayTeams) {
      const swimmers: string[] = JSON.parse(relay.swimmers || '[]');
      if (swimmers.includes(sourceId)) {
        const updated = swimmers.map(id => (id === sourceId ? targetId : id));
        await relay.update({ swimmers: JSON.stringify(updated) });
      }
    }

    // Delete source swimmer
    await source.destroy();

    return NextResponse.json({
      success: true,
      targetId,
      movedTimes: movedTimes[0],
    });
  } catch (error) {
    console.error('Error merging swimmers:', error);
    return NextResponse.json({ error: 'Failed to merge swimmers' }, { status: 500 });
  }
}

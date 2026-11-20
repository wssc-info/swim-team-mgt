import { NextRequest, NextResponse } from 'next/server';
import {
  FamilySwimmerAssociationModel,
  SwimmerModel,
  UserModel,
  SwimClubModel,
  initializeDatabase,
} from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const user = await AuthService.getInstance().getUser(request);
    if (!user || (user.role !== 'coach' && user.role !== 'admin' && user.role !== 'leagueAdmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statusFilter = request.nextUrl.searchParams.get('status') || 'pending';

    // Get all pending associations; then filter by coach's club
    const associations = await FamilySwimmerAssociationModel.findAll({
      where: { status: statusFilter },
    });

    const enriched = await Promise.all(
      associations.map(async (assoc) => {
        const swimmer = await SwimmerModel.findByPk(assoc.swimmerId);
        const familyUser = await UserModel.findByPk(assoc.userId);

        // Filter to coach's club
        if (user.role === 'coach' && swimmer?.clubId !== user.clubId) return null;

        // For leagueAdmin with a clubId param or selected club
        const paramClubId = request.nextUrl.searchParams.get('clubId');
        const effectiveClubId = user.clubId || paramClubId;
        if (effectiveClubId && swimmer?.clubId && swimmer.clubId !== effectiveClubId) return null;

        return {
          id: assoc.id,
          status: assoc.status,
          createdAt: assoc.createdAt,
          swimmer: swimmer
            ? {
                id: swimmer.id,
                firstName: swimmer.firstName,
                lastName: swimmer.lastName,
                dateOfBirth: swimmer.dateOfBirth,
                gender: swimmer.gender,
                clubId: swimmer.clubId,
              }
            : null,
          familyUser: familyUser
            ? {
                id: familyUser.id,
                firstName: familyUser.firstName,
                lastName: familyUser.lastName,
                email: familyUser.email,
              }
            : null,
        };
      })
    );

    return NextResponse.json(enriched.filter(Boolean));
  } catch (error) {
    console.error('Error fetching associations:', error);
    return NextResponse.json({ error: 'Failed to fetch associations' }, { status: 500 });
  }
}

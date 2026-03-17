import { NextRequest, NextResponse } from 'next/server';
import { SwimmerModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';
import { Op } from 'sequelize';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getInstance().getUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { swimmerIds, clubId } = body;

    if (!Array.isArray(swimmerIds) || swimmerIds.length === 0) {
      return NextResponse.json({ error: 'swimmerIds must be a non-empty array' }, { status: 400 });
    }

    await initializeDatabase();

    // Use a single bulk UPDATE ... WHERE id IN (...).
    // clubId may be a string (assign) or null (remove assignment).
    await SwimmerModel.update(
      { clubId: clubId ?? null },
      { where: { id: { [Op.in]: swimmerIds } } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning club to swimmers:', error);
    return NextResponse.json({ error: 'Failed to assign club' }, { status: 500 });
  }
}

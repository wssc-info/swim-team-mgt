import { NextRequest, NextResponse } from 'next/server';
import { UserModel, initializeDatabase } from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    const user = await AuthService.getInstance().getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { firstName, lastName, phoneNumber, clubId } = await request.json();
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    await UserModel.update(
      { firstName, lastName, phoneNumber: phoneNumber || null, clubId: clubId || null },
      { where: { id: user.id } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

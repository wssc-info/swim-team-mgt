import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserModel, FamilySwimmerAssociationModel, initializeDatabase } from '@/lib/models';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  try {
    await initializeDatabase();
    
    const updates = await request.json();
    let { clubId } = updates;
    const { leagueId } = updates;
    const { firstName, lastName, email, password, role, phoneNumber } = updates;

    // Normalize clubId
    if (!clubId || (typeof clubId === 'string' && clubId.trim() === '')) {
      clubId = null;
    }

    // Club validation - ensure club exists if provided
    if (clubId) {
      const { SwimClubModel } = await import('@/lib/models');
      const club = await SwimClubModel.findByPk(clubId);
      if (!club) {
        return NextResponse.json({error: 'Invalid club selected'}, {status: 400});
      }
    }

    const updateData: any = {
      firstName,
      lastName,
      email,
      role,
      clubId,
      leagueId: leagueId || null,
      phoneNumber: phoneNumber || null,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await UserModel.update(updateData, {
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;
  try {
    await initializeDatabase();
    
    // Delete user associations first
    await FamilySwimmerAssociationModel.destroy({
      where: { userId: id }
    });

    // Delete the user
    await UserModel.destroy({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

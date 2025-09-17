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
    let { firstName, lastName, email, password, role, clubId } = updates;

    // Normalize clubId - convert empty string to null for admin users
    if (!clubId || clubId.trim() === '') {
      if (role === 'admin') {
        clubId = null; // Admin users can have null clubId
      } else {
        return NextResponse.json({error: 'Club is required for non-admin users'}, {status: 400});
      }
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

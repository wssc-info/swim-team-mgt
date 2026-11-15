import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserModel, PasswordResetTokenModel, initializeDatabase } from '@/lib/models';
import { Op } from 'sequelize';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const resetToken = await PasswordResetTokenModel.findOne({
      where: { token, expiresAt: { [Op.gt]: new Date() } },
    });
    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.update({ password: hashed }, { where: { id: resetToken.userId } });
    await resetToken.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in reset-password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

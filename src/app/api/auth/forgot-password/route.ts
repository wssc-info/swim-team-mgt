import { NextRequest, NextResponse } from 'next/server';
import { UserModel, PasswordResetTokenModel, initializeDatabase } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Always return success to avoid email enumeration
    const user = await UserModel.findOne({ where: { email: email.toLowerCase() } });
    if (user) {
      // Delete any existing token for this user
      await PasswordResetTokenModel.destroy({ where: { userId: user.id } });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await PasswordResetTokenModel.create({ id: uuidv4(), userId: user.id, token, expiresAt });

      // Log the reset URL (email sending requires SMTP config)
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forgot-password?token=${token}`;
      console.log(`Password reset link for ${email}: ${resetUrl}`);

      // If SMTP is configured, send email here
      // For now, we just log it
    }

    return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

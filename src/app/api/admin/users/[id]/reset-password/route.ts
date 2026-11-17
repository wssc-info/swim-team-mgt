import { NextRequest, NextResponse } from 'next/server';
import { UserModel, PasswordResetTokenModel, initializeDatabase } from '@/lib/models';
import { sendPasswordResetEmail } from '@/lib/email';
import { AuthService } from '@/lib/services/auth-service';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = AuthService.getInstance().verifyToken(token);
    if (!decoded || !['admin', 'leagueAdmin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const user = await UserModel.findByPk(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await PasswordResetTokenModel.destroy({ where: { userId: user.id } });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordResetTokenModel.create({ id: uuidv4(), userId: user.id, token: resetToken, expiresAt });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await sendPasswordResetEmail(user.email, `${appUrl}/forgot-password?token=${resetToken}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending reset link:', error);
    return NextResponse.json({ error: 'Failed to send reset link' }, { status: 500 });
  }
}

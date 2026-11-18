import {NextRequest, NextResponse} from 'next/server';
import {AuthService} from '@/lib/services/auth-service';
import {UserModel, FamilySwimmerAssociationModel, SwimClubModel, PasswordResetTokenModel, initializeDatabase} from '@/lib/models';
import {sendWelcomeEmail} from '@/lib/email';
import DbConnection from "@/lib/db-connection";
import {v4 as uuidv4} from 'uuid';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    DbConnection.getInstance();

    // Get the current user from the token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let currentUser = null;

    if (token) {
      try {
        const decoded =
          AuthService.getInstance().verifyToken(token);
        ;
        if (decoded && typeof decoded !== 'string') {
          currentUser = await UserModel.findByPk(decoded.userId);
        }
      } catch (error) {
        // Token invalid, continue without current user
        return NextResponse.json({error: 'Invalid token'}, {status: 401});
      }
    }
    // If no current user, return unauthorized
    if (!currentUser) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Build query conditions based on current user's role and club
    const paramClubId = request.nextUrl.searchParams.get('clubId');
    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'leagueAdmin';
    const effectiveClubId = currentUser.clubId || (isPrivileged ? paramClubId : null);
    const whereConditions: any = effectiveClubId ? { clubId: effectiveClubId } : {};

    // Get users with their associations
    const users = await UserModel.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']]
    });

    const usersWithAssociations = await Promise.all(
      users.map(async (user) => {
        const associations = await FamilySwimmerAssociationModel.findAll({
          where: {userId: user.id}
        });

        // Get club info if user has a clubId
        let club = null;
        if (user.clubId) {
          club = await SwimClubModel.findByPk(user.clubId);
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          clubId: user.clubId,
          phoneNumber: user.phoneNumber,
          club: club ? {
            id: club.id,
            name: club.name,
            abbreviation: club.abbreviation
          } : null,
          createdAt: user.createdAt.toISOString(),
          associatedSwimmers: associations.map(assoc => assoc.swimmerId),
        };
      })
    );

    return NextResponse.json(usersWithAssociations);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({error: 'Failed to fetch users'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = AuthService.getInstance().verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await UserModel.findByPk(decoded.userId);
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userData = await request.json();

    const {email, firstName, lastName} = userData;
    let {role, clubId} = userData;
    const {leagueId, phoneNumber} = userData;
    let password = userData.password;

    if (!email || !firstName || !lastName) {
      return NextResponse.json({error: 'Email, first name, and last name are required'}, {status: 400});
    }

    // Auto-generate password if not provided
    if (!password) {
      const { v4: uuidv4 } = await import('uuid');
      password = uuidv4().replace(/-/g, '').slice(0, 16) + 'Aa1!';
    }

    // Role validation and default assignment
    if (!role) {
      role = 'family'; // Default role
    }

    const isPrivileged = ['admin', 'leagueAdmin'].includes(currentUser.role);

    // Only admins/leagueAdmins can set elevated roles
    if (!isPrivileged && ['admin', 'coach', 'leagueAdmin'].includes(role)) {
      role = 'family';
    }

    if (!['admin', 'coach', 'family', 'leagueAdmin'].includes(role)) {
      return NextResponse.json({error: 'Invalid role'}, {status: 400});
    }

    // admin and leagueAdmin roles don't require a club
    const roleRequiresClub = !['admin', 'leagueAdmin'].includes(role);

    if (!clubId || clubId.trim() === '') {
      clubId = null;
      if (roleRequiresClub) {
        if (currentUser.clubId) {
          clubId = currentUser.clubId;
        } else {
          return NextResponse.json({error: 'Club is required for this role'}, {status: 400});
        }
      }
    }

    // Club validation
    if (clubId) {
      const club = await SwimClubModel.findByPk(clubId);
      if (!club) {
        return NextResponse.json({error: 'Invalid club selected'}, {status: 400});
      }
      // leagueAdmins and admins can assign any club; coaches/coaches are restricted to their own
      if (!isPrivileged && clubId !== currentUser.clubId) {
        return NextResponse.json({error: 'You can only assign users to your own club'}, {status: 403});
      }
    }

    // Normalize phone number to E.164 if provided
    let normalizedPhone = phoneNumber;
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length === 10) normalizedPhone = `+1${digits}`;
      else if (digits.length === 11 && digits.startsWith('1')) normalizedPhone = `+${digits}`;
      else normalizedPhone = phoneNumber;
    }

    const authService = AuthService.getInstance();
    const user = await authService.register({...userData, password, clubId, leagueId: leagueId || undefined, phoneNumber: normalizedPhone});

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await PasswordResetTokenModel.create({ id: uuidv4(), userId: user.id, token: resetToken, expiresAt });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await sendWelcomeEmail(email, firstName, `${appUrl}/forgot-password?token=${resetToken}`);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({error: 'Failed to create user'}, {status: 500});
  }
}

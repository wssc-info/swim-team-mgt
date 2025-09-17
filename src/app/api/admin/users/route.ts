import {NextRequest, NextResponse} from 'next/server';
import {AuthService} from '@/lib/services/auth-service';
import {UserModel, FamilySwimmerAssociationModel, SwimClubModel, initializeDatabase} from '@/lib/models';
import DbConnection from "@/lib/db-connection";
import jwt from 'jsonwebtoken';

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
    const whereConditions: any = (currentUser.clubId ? {
      clubId: currentUser.clubId
    } : {});
    console.log(whereConditions)

    // If current user is not admin and has a club, filter by club
    if (currentUser?.role !== 'admin' && currentUser?.clubId) {
      whereConditions.clubId = currentUser.clubId;
    }

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
    // Get the current user from the token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let currentUser = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        currentUser = await UserModel.findByPk(decoded.userId);
      } catch (error) {
        // Token invalid, continue without current user
      }
    }

    const userData = await request.json();

    const {email, password, firstName, lastName} = userData;
    let {role, clubId} = userData;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({error: 'Email, password, first name, and last name are required'}, {status: 400});
    }

    // Role validation and default assignment
    if (!role) {
      role = 'family'; // Default role
    }

    // Only admins can set admin or coach roles
    if (currentUser?.role !== 'admin' && (role === 'admin' || role === 'coach')) {
      role = 'family'; // Force to family role if not admin
    }

    if (!['admin', 'coach', 'family'].includes(role)) {
      return NextResponse.json({error: 'Invalid role'}, {status: 400});
    }

    // Normalize clubId - convert empty string to null for admin users
    if (!clubId || clubId.trim() === '') {
      if (role === 'admin') {
        clubId = null; // Admin users can have null clubId
      } else if (currentUser?.clubId) {
        // Non-admin users default to their club if no club specified
        clubId = currentUser.clubId;
      } else {
        return NextResponse.json({error: 'Club is required for non-admin users'}, {status: 400});
      }
    }

    // Club validation - non-admins can only assign users to their own club
    if (clubId) {
      const club = await SwimClubModel.findByPk(clubId);
      if (!club) {
        return NextResponse.json({error: 'Invalid club selected'}, {status: 400});
      }

      // If current user is not admin, they can only assign to their own club
      if (currentUser?.role !== 'admin' && clubId !== currentUser?.clubId) {
        return NextResponse.json({error: 'You can only assign users to your own club'}, {status: 403});
      }
    }

    const authService = AuthService.getInstance();
    const user = await authService.register({...userData, clubId});

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({error: 'Failed to create user'}, {status: 500});
  }
}

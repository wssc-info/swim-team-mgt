import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { UserModel, FamilySwimmerAssociationModel, initializeDatabase } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    // Get all users with their associations
    const users = await UserModel.findAll({
      order: [['createdAt', 'DESC']]
    });

    const usersWithAssociations = await Promise.all(
      users.map(async (user) => {
        const associations = await FamilySwimmerAssociationModel.findAll({
          where: { userId: user.id }
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt.toISOString(),
          associatedSwimmers: associations.map(assoc => assoc.swimmerId),
        };
      })
    );

    return NextResponse.json(usersWithAssociations);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    const { email, password, role, firstName, lastName } = userData;
    
    if (!email || !password || !role || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!['coach', 'family'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const authService = AuthService.getInstance();
    const user = await authService.register(userData);
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

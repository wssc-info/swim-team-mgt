import {v4 as uuidv4} from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {UserModel, FamilySwimmerAssociationModel, initializeDatabase} from '../models';
import {User, FamilySwimmerAssociation} from '../types';
import {NextRequest, NextResponse} from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || 'zMtPQTlzLMKg3VlUl5b8i3j1h8phC0';

export class AuthService {
  private static instance: AuthService;
  private initialized = false;

  private constructor() {
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  public async login(email: string, password: string): Promise<{ user: Omit<User, 'password'>, token: string } | null> {
    await this.ensureInitialized();
    try {
      const user = await UserModel.findOne({where: {email}});
      if (!user) return null;

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return null;

      const token = jwt.sign(
        {userId: user.id, email: user.email, role: user.role},
        JWT_SECRET,
        {expiresIn: '24h'}
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          clubId: user.clubId,
          createdAt: user.createdAt.toISOString(),
        },
        token
      };
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  }

  public async register(userData: Omit<User, 'id' | 'createdAt'>): Promise<Omit<User, 'password'>> {
    await this.ensureInitialized();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser: User = {
      ...userData,
      id: uuidv4(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    try {
      await UserModel.create({
        id: newUser.id,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        clubId: userData.clubId,
      });

      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        clubId: userData.clubId,
        createdAt: newUser.createdAt,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  public async getUser(request: NextRequest): Promise<UserModel | null> {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let currentUser: UserModel | null = null;

    if (token) {
      try {
        const decoded = this.verifyToken(token);

        if (decoded && typeof decoded !== 'string') {
          currentUser = await UserModel.findByPk(decoded.userId);
        }
      } catch (error) {
        console.error(error);
      }
    }
    return currentUser;
  }

  public verifyToken(token: string): { userId: string, email: string, role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {userId: decoded.userId, email: decoded.email, role: decoded.role};
    } catch (error) {
      return null;
    }
  }

  public async associateSwimmerWithFamily(userId: string, swimmerId: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await FamilySwimmerAssociationModel.create({
        id: uuidv4(),
        userId,
        swimmerId,
      });
    } catch (error) {
      console.error('Error associating swimmer with family:', error);
      throw error;
    }
  }

  public async getSwimmersForFamily(userId: string): Promise<string[]> {
    await this.ensureInitialized();
    try {
      const associations = await FamilySwimmerAssociationModel.findAll({
        where: {userId}
      });
      return associations.map(assoc => assoc.swimmerId);
    } catch (error) {
      console.error('Error fetching swimmers for family:', error);
      return [];
    }
  }

  public async removeSwimmerFromFamily(userId: string, swimmerId: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await FamilySwimmerAssociationModel.destroy({
        where: {userId, swimmerId}
      });
    } catch (error) {
      console.error('Error removing swimmer from family:', error);
      throw error;
    }
  }
}

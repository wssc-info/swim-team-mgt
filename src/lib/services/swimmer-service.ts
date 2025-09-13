import { v4 as uuidv4 } from 'uuid';
import { SwimmerModel, FamilySwimmerAssociationModel, initializeDatabase } from '../models';
import { Swimmer } from '../types';

export class SwimmerService {
  private static instance: SwimmerService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SwimmerService {
    if (!SwimmerService.instance) {
      SwimmerService.instance = new SwimmerService();
    }
    return SwimmerService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  public async getSwimmers(): Promise<Swimmer[]> {
    await this.ensureInitialized();
    try {
      const swimmers = await SwimmerModel.findAll();
      return swimmers.map(swimmer => ({
        id: swimmer.id,
        firstName: swimmer.firstName,
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        gender: swimmer.gender,
        ageGroup: swimmer.ageGroup,
        clubId: swimmer.clubId,
      }));
    } catch (error) {
      console.error('Error fetching swimmers:', error);
      return [];
    }
  }

  public async getAssociatedSwimmers(userId: string): Promise<Swimmer[]> {
    await this.ensureInitialized();
    try {
      // Get all associations for this user
      const associations = await FamilySwimmerAssociationModel.findAll({
        where: { userId }
      });

      if (associations.length === 0) {
        return [];
      }

      // Get swimmer IDs from associations
      const swimmerIds = associations.map(assoc => assoc.swimmerId);

      // Fetch the actual swimmer records
      const swimmers = await SwimmerModel.findAll({
        where: {
          id: swimmerIds
        }
      });

      return swimmers.map(swimmer => ({
        id: swimmer.id,
        firstName: swimmer.firstName,
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        gender: swimmer.gender,
        ageGroup: swimmer.ageGroup,
        clubId: swimmer.clubId,
      }));
    } catch (error) {
      console.error('Error fetching associated swimmers:', error);
      return [];
    }
  }

  public async addSwimmer(swimmer: Omit<Swimmer, 'id' | 'ageGroup'>): Promise<Swimmer> {
    await this.ensureInitialized();
    const newSwimmer: Swimmer = {
      ...swimmer,
      id: uuidv4(),
      ageGroup: this.calculateAgeGroup(swimmer.dateOfBirth),
    };
    
    try {
      await SwimmerModel.create({
        id: newSwimmer.id,
        firstName: newSwimmer.firstName,
        lastName: newSwimmer.lastName,
        dateOfBirth: newSwimmer.dateOfBirth,
        gender: newSwimmer.gender,
        ageGroup: newSwimmer.ageGroup,
        clubId: newSwimmer.clubId,
      });
      
      return newSwimmer;
    } catch (error) {
      console.error('Error adding swimmer:', error);
      throw error;
    }
  }

  public async updateSwimmer(id: string, updates: Partial<Swimmer>): Promise<void> {
    await this.ensureInitialized();
    try {
      const updateData: any = { ...updates };
      
      if (updates.dateOfBirth) {
        updateData.ageGroup = this.calculateAgeGroup(updates.dateOfBirth);
      }
      
      await SwimmerModel.update(updateData, { where: { id } });
    } catch (error) {
      console.error('Error updating swimmer:', error);
      throw error;
    }
  }

  public async deleteSwimmer(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await SwimmerModel.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting swimmer:', error);
      throw error;
    }
  }

  private calculateAgeGroup(dateOfBirth: string): string {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age;

    if (actualAge <= 8) return '8&U';
    if (actualAge <= 10) return '9-10';
    if (actualAge <= 12) return '11-12';
    if (actualAge <= 14) return '13-14';
    return '15-18';
  }
}

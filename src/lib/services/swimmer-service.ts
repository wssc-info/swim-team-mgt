import {v4 as uuidv4} from 'uuid';
import {SwimmerModel, FamilySwimmerAssociationModel, initializeDatabase} from '../models';
import {Swimmer} from '../types';
import {generateSwimmerExternalId, calculateAgeGroup} from "@/lib/utils";

export class SwimmerService {
  private static instance: SwimmerService;
  private initialized = false;

  private constructor() {
  }

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

  public async getSwimmers(clubId?: string, active?: boolean): Promise<Swimmer[]> {
    await this.ensureInitialized();
    const where = clubId ? {clubId} : {};
    if (active !== undefined) {
      Object.assign(where, {active});
    }
    try {
      const swimmers = await SwimmerModel.findAll({
          where,
          order:
            [
              ['lastName', 'ASC'],
              ['firstName', 'ASC']
            ]
      });
      return swimmers.map(swimmer => ({
        id: swimmer.id,
        firstName: swimmer.firstName,
        middleInitial: swimmer.middleInitial,
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        gender: swimmer.gender,
        ageGroup: swimmer.ageGroup,
        clubId: swimmer.clubId,
        externalId: swimmer.externalId,
        active: swimmer.active
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
        where: {userId}
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
        middleInitial: swimmer.middleInitial,
        lastName: swimmer.lastName,
        dateOfBirth: swimmer.dateOfBirth,
        gender: swimmer.gender,
        ageGroup: swimmer.ageGroup,
        clubId: swimmer.clubId,
        externalId: swimmer.externalId,
        active: swimmer.active
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
      ageGroup: calculateAgeGroup(swimmer.dateOfBirth),
    };

    try {
      await SwimmerModel.create({
        id: newSwimmer.id,
        firstName: newSwimmer.firstName,
        middleInitial: newSwimmer.middleInitial,
        lastName: newSwimmer.lastName,
        dateOfBirth: newSwimmer.dateOfBirth,
        gender: newSwimmer.gender,
        ageGroup: newSwimmer.ageGroup,
        clubId: newSwimmer.clubId,
        externalId: newSwimmer.externalId || generateSwimmerExternalId(newSwimmer),
        active: newSwimmer.active
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
      const updateData: any = {...updates};

      if (updates.dateOfBirth) {
        updateData.ageGroup = calculateAgeGroup(updates.dateOfBirth);
      }

      await SwimmerModel.update(updateData, {where: {id}});
    } catch (error) {
      console.error('Error updating swimmer:', error);
      throw error;
    }
  }

  public async deleteSwimmer(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await SwimmerModel.destroy({where: {id}});
    } catch (error) {
      console.error('Error deleting swimmer:', error);
      throw error;
    }
  }

}

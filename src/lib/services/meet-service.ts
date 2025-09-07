import { v4 as uuidv4 } from 'uuid';
import { MeetModel, initializeDatabase } from '../models';
import { Meet } from '../types';

export class MeetService {
  private static instance: MeetService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): MeetService {
    if (!MeetService.instance) {
      MeetService.instance = new MeetService();
    }
    return MeetService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  public async getMeets(): Promise<Meet[]> {
    await this.ensureInitialized();
    try {
      const meets = await MeetModel.findAll();
      return meets.map(meet => ({
        id: meet.id,
        name: meet.name,
        date: meet.date,
        location: meet.location,
        availableEvents: JSON.parse(meet.availableEvents || '[]'),
        isActive: meet.isActive,
        createdAt: (meet.createdAt || new Date()).toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching meets:', error);
      return [];
    }
  }

  public async addMeet(meet: Omit<Meet, 'id' | 'createdAt'>): Promise<Meet> {
    await this.ensureInitialized();
    const newMeet: Meet = {
      ...meet,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    try {
      // If this meet is being set as active, deactivate all others
      if (newMeet.isActive) {
        await MeetModel.update({ isActive: false }, { where: {} });
      }
      
      await MeetModel.create({
        id: newMeet.id,
        name: newMeet.name,
        date: newMeet.date,
        location: newMeet.location,
        availableEvents: JSON.stringify(newMeet.availableEvents),
        isActive: newMeet.isActive,
      });
      
      return newMeet;
    } catch (error) {
      console.error('Error adding meet:', error);
      throw error;
    }
  }

  public async updateMeet(id: string, updates: Partial<Meet>): Promise<void> {
    await this.ensureInitialized();
    try {
      // If setting this meet as active, deactivate all others
      if (updates.isActive) {
        await MeetModel.update({ isActive: false }, { where: {} });
      }
      
      const updateData: any = { ...updates };
      
      if (updates.availableEvents) {
        updateData.availableEvents = JSON.stringify(updates.availableEvents);
      }
      
      await MeetModel.update(updateData, { where: { id } });
    } catch (error) {
      console.error('Error updating meet:', error);
      throw error;
    }
  }

  public async deleteMeet(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await MeetModel.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting meet:', error);
      throw error;
    }
  }

  public async getActiveMeet(): Promise<Meet | null> {
    await this.ensureInitialized();
    try {
      const meet = await MeetModel.findOne({ where: { isActive: true } });
      if (!meet) return null;
      
      return {
        id: meet.id,
        name: meet.name,
        date: meet.date,
        location: meet.location,
        availableEvents: JSON.parse(meet.availableEvents || '[]'),
        isActive: meet.isActive,
        createdAt: meet.createdAt.toISOString(),
      };
    } catch (error) {
      console.error('Error fetching active meet:', error);
      return null;
    }
  }

  public async setActiveMeet(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      // Deactivate all meets first
      await MeetModel.update({ isActive: false }, { where: {} });
      // Then activate the specified meet
      await MeetModel.update({ isActive: true }, { where: { id } });
    } catch (error) {
      console.error('Error setting active meet:', error);
      throw error;
    }
  }
}

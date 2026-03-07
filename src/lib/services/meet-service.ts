import { v4 as uuidv4 } from 'uuid';
import { MeetModel, initializeDatabase } from '../models';
import { Meet } from '../types';
import {Op, Sequelize} from "sequelize";

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

  public async getMeet(meetId: string): Promise<Meet | undefined> {
    await this.ensureInitialized();
      const meet = await MeetModel.findByPk(meetId);
      if (!meet) {
        return undefined;
      }
      return {
        id: meet.id,
        name: meet.name,
        date: meet.date,
        location: meet.location,
        course: meet.course,
        availableEvents: JSON.parse(meet.availableEvents || '[]'),
        meetEvents: JSON.parse(meet.meetEvents || '[]'),
        clubId: meet.clubId,
        againstClubId: meet.againstClubId,
        createdAt: (meet.createdAt || new Date()).toISOString(),
      };
  }
  public async getMeets(activeOnly: boolean, clubId?: string): Promise<Meet[]> {
    await this.ensureInitialized();
    try {
      const whereClause = activeOnly ? { isActive: true } : {};
      if(clubId) {
        //Object.assign(whereClause, { clubId });
        Object.assign(whereClause, { [Op.or]: [{ clubId }, { againstClubId: clubId }] });
      }
      const meets = await MeetModel.findAll({
        order: [['date', 'DESC']],
        where: whereClause
      });
      return meets.map(meet => ({
        id: meet.id,
        name: meet.name,
        date: meet.date,
        location: meet.location,
        course: meet.course,
        availableEvents: JSON.parse(meet.availableEvents || '[]'),
        meetEvents: JSON.parse(meet.meetEvents || '[]'),
        clubId: meet.clubId,
        againstClubId: meet.againstClubId,
        createdAt: (meet.createdAt || new Date()).toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching meets:', error);
      return [];
    }
  }

  public async addMeet(meetData: Omit<Meet, 'id' | 'createdAt'>): Promise<Meet> {
    await this.ensureInitialized();
    
    try {
      const meet = await MeetModel.create({
        id: uuidv4(),
        name: meetData.name,
        date: meetData.date,
        location: meetData.location,
        course: meetData.course,
        availableEvents: JSON.stringify(meetData.availableEvents || []),
        meetEvents: JSON.stringify(meetData.meetEvents || []),
        clubId: meetData.clubId,
        againstClubId: meetData.againstClubId || undefined,
      });
      
      return {
        id: meet.id,
        name: meet.name,
        date: meet.date,
        location: meet.location,
        course: meet.course,
        availableEvents: JSON.parse(meet.availableEvents),
        meetEvents: JSON.parse(meet.meetEvents || '[]'),
        clubId: meet.clubId,
        againstClubId: meet.againstClubId,
        createdAt: meet.createdAt.toISOString(),
      };
    } catch (error) {
      console.error('Error adding meet:', error);
      throw error;
    }
  }

  public async updateMeet(id: string, updates: Partial<Meet>): Promise<void> {
    await this.ensureInitialized();
    try {
      const updateData: any = { ...updates };
      
      if (updates.availableEvents) {
        updateData.availableEvents = JSON.stringify(updates.availableEvents);
      }
      
      if (updates.meetEvents) {
        updateData.meetEvents = JSON.stringify(updates.meetEvents);
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

}

import { v4 as uuidv4 } from 'uuid';
import { SwimmerMeetEventModel, initializeDatabase } from '../models';
import { SwimmerMeetEvent } from '../types';

export class SwimmerMeetEventService {
  private static instance: SwimmerMeetEventService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SwimmerMeetEventService {
    if (!SwimmerMeetEventService.instance) {
      SwimmerMeetEventService.instance = new SwimmerMeetEventService();
    }
    return SwimmerMeetEventService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  public async getSwimmerMeetEvents(swimmerId: string, meetId: string): Promise<SwimmerMeetEvent[]> {
    await this.ensureInitialized();
    try {
      const events = await SwimmerMeetEventModel.findAll({
        where: { swimmerId, meetId }
      });
      return events.map(event => ({
        id: event.id,
        swimmerId: event.swimmerId,
        meetId: event.meetId,
        eventId: event.eventId,
        seedTime: event.seedTime,
        createdAt: event.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching swimmer meet events:', error);
      return [];
    }
  }

  public async addSwimmerMeetEvent(data: Omit<SwimmerMeetEvent, 'id' | 'createdAt'>): Promise<SwimmerMeetEvent> {
    await this.ensureInitialized();
    const newEvent: SwimmerMeetEvent = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    try {
      await SwimmerMeetEventModel.create({
        id: newEvent.id,
        swimmerId: newEvent.swimmerId,
        meetId: newEvent.meetId,
        eventId: newEvent.eventId,
        seedTime: newEvent.seedTime,
      });
      
      return newEvent;
    } catch (error) {
      console.error('Error adding swimmer meet event:', error);
      throw error;
    }
  }

  public async updateSwimmerMeetEvent(id: string, updates: Partial<SwimmerMeetEvent>): Promise<void> {
    await this.ensureInitialized();
    try {
      await SwimmerMeetEventModel.update(updates, { where: { id } });
    } catch (error) {
      console.error('Error updating swimmer meet event:', error);
      throw error;
    }
  }

  public async deleteSwimmerMeetEvent(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await SwimmerMeetEventModel.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting swimmer meet event:', error);
      throw error;
    }
  }

  public async deleteSwimmerMeetEvents(swimmerId: string, meetId: string, eventIds: string[]): Promise<void> {
    await this.ensureInitialized();
    try {
      await SwimmerMeetEventModel.destroy({
        where: {
          swimmerId,
          meetId,
          eventId: eventIds
        }
      });
    } catch (error) {
      console.error('Error deleting swimmer meet events:', error);
      throw error;
    }
  }

  public async replaceSwimmerMeetEvents(
    swimmerId: string, 
    meetId: string, 
    eventSelections: { eventId: string; seedTime?: string }[]
  ): Promise<void> {
    await this.ensureInitialized();
    try {
      // Delete existing events for this swimmer and meet
      await SwimmerMeetEventModel.destroy({
        where: { swimmerId, meetId }
      });

      // Add new events
      if (eventSelections.length > 0) {
        const newEvents = eventSelections.map(selection => ({
          id: uuidv4(),
          swimmerId,
          meetId,
          eventId: selection.eventId,
          seedTime: selection.seedTime,
        }));

        await SwimmerMeetEventModel.bulkCreate(newEvents);
      }
    } catch (error) {
      console.error('Error replacing swimmer meet events:', error);
      throw error;
    }
  }
}

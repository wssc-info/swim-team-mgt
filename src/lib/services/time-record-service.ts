import { v4 as uuidv4 } from 'uuid';
import { TimeRecordModel, initializeDatabase } from '../models';
import { TimeRecord } from '../types';

export class TimeRecordService {
  private static instance: TimeRecordService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): TimeRecordService {
    if (!TimeRecordService.instance) {
      TimeRecordService.instance = new TimeRecordService();
    }
    return TimeRecordService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  public async getTimeRecords(swimmerId?: string): Promise<TimeRecord[]> {
    await this.ensureInitialized();
    try {
      const whereClause = swimmerId ? { swimmerId } : {};
      const records = await TimeRecordModel.findAll({ 
        where: whereClause,
        order: [['meetDate', 'DESC'], ['createdAt', 'DESC']]
      });
      return records.map(record => ({
        id: record.id,
        swimmerId: record.swimmerId,
        eventId: record.eventId,
        time: record.time,
        meetName: record.meetName,
        meetDate: record.meetDate,
        isPersonalBest: record.isPersonalBest,
        createdAt: record.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching time records:', error);
      return [];
    }
  }

  public async addTimeRecord(record: Omit<TimeRecord, 'id' | 'createdAt' | 'isPersonalBest'>): Promise<TimeRecord> {
    await this.ensureInitialized();
    const newRecord: TimeRecord = {
      ...record,
      id: uuidv4(),
      isPersonalBest: false,
      createdAt: new Date().toISOString(),
    };
    
    try {
      // Check if this is a personal best
      const existingRecords = await TimeRecordModel.findAll({
        where: { 
          swimmerId: record.swimmerId,
          eventId: record.eventId
        }
      });
      
      const newTimeSeconds = this.timeToSeconds(record.time);
      let isPersonalBest = true;
      
      for (const existing of existingRecords) {
        const existingTimeSeconds = this.timeToSeconds(existing.time);
        if (existingTimeSeconds <= newTimeSeconds) {
          isPersonalBest = false;
          break;
        }
      }
      
      newRecord.isPersonalBest = isPersonalBest;
      
      // If this is a new personal best, update all other records for this swimmer/event
      if (isPersonalBest) {
        await TimeRecordModel.update(
          { isPersonalBest: false },
          { 
            where: { 
              swimmerId: record.swimmerId,
              eventId: record.eventId
            }
          }
        );
      }
      
      await TimeRecordModel.create({
        id: newRecord.id,
        swimmerId: newRecord.swimmerId,
        eventId: newRecord.eventId,
        time: newRecord.time,
        meetName: newRecord.meetName,
        meetDate: newRecord.meetDate,
        isPersonalBest: newRecord.isPersonalBest,
      });
      
      return newRecord;
    } catch (error) {
      console.error('Error adding time record:', error);
      throw error;
    }
  }

  public async updateTimeRecord(id: string, updates: Partial<TimeRecord>): Promise<void> {
    await this.ensureInitialized();
    try {
      await TimeRecordModel.update(updates, { where: { id } });
      
      // If time was updated, recalculate personal bests for this swimmer/event
      if (updates.time) {
        const record = await TimeRecordModel.findByPk(id);
        if (record) {
          await this.recalculatePersonalBests(record.swimmerId, record.eventId);
        }
      }
    } catch (error) {
      console.error('Error updating time record:', error);
      throw error;
    }
  }

  public async deleteTimeRecord(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      const record = await TimeRecordModel.findByPk(id);
      if (record) {
        await TimeRecordModel.destroy({ where: { id } });
        // Recalculate personal bests after deletion
        await this.recalculatePersonalBests(record.swimmerId, record.eventId);
      }
    } catch (error) {
      console.error('Error deleting time record:', error);
      throw error;
    }
  }

  public async getBestTimeForEvent(swimmerId: string, eventId: string): Promise<string | null> {
    await this.ensureInitialized();
    try {
      const record = await TimeRecordModel.findOne({
        where: { 
          swimmerId,
          eventId,
          isPersonalBest: true
        }
      });
      return record ? record.time : null;
    } catch (error) {
      console.error('Error fetching best time:', error);
      return null;
    }
  }

  public async getBestTimesForSwimmer(swimmerId: string): Promise<Record<string, string>> {
    await this.ensureInitialized();
    try {
      const records = await TimeRecordModel.findAll({
        where: { 
          swimmerId,
          isPersonalBest: true
        }
      });
      
      const bestTimes: Record<string, string> = {};
      records.forEach(record => {
        bestTimes[record.eventId] = record.time;
      });
      
      return bestTimes;
    } catch (error) {
      console.error('Error fetching best times for swimmer:', error);
      return {};
    }
  }

  private timeToSeconds(timeString: string): number {
    if (!timeString || timeString === 'NT') return Infinity;
    
    const parts = timeString.split(':');
    if (parts.length !== 2) return Infinity;
    
    const minutes = parseInt(parts[0]) || 0;
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]) || 0;
    const centiseconds = parseInt((secondsParts[1] || '00').padEnd(2, '0').substring(0, 2)) || 0;
    
    return (minutes * 60) + seconds + (centiseconds / 100);
  }

  private async recalculatePersonalBests(swimmerId: string, eventId: string): Promise<void> {
    try {
      const records = await TimeRecordModel.findAll({
        where: { swimmerId, eventId },
        order: [['createdAt', 'ASC']]
      });
      
      if (records.length === 0) return;
      
      // Reset all to not personal best
      await TimeRecordModel.update(
        { isPersonalBest: false },
        { where: { swimmerId, eventId } }
      );
      
      // Find the best time
      let bestTime = Infinity;
      let bestRecordId = '';
      
      for (const record of records) {
        const timeSeconds = this.timeToSeconds(record.time);
        if (timeSeconds < bestTime) {
          bestTime = timeSeconds;
          bestRecordId = record.id;
        }
      }
      
      // Mark the best time as personal best
      if (bestRecordId) {
        await TimeRecordModel.update(
          { isPersonalBest: true },
          { where: { id: bestRecordId } }
        );
      }
    } catch (error) {
      console.error('Error recalculating personal bests:', error);
    }
  }
}

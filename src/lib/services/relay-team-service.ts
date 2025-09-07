import { v4 as uuidv4 } from 'uuid';
import { RelayTeamModel, initializeDatabase } from '../models';
import { RelayTeam } from '../types';

export class RelayTeamService {
  private static instance: RelayTeamService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): RelayTeamService {
    if (!RelayTeamService.instance) {
      RelayTeamService.instance = new RelayTeamService();
    }
    return RelayTeamService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeDatabase();
      this.initialized = true;
    }
  }

  public async getRelayTeams(meetId?: string): Promise<RelayTeam[]> {
    await this.ensureInitialized();
    try {
      const whereClause = meetId ? { meetId } : {};
      const relayTeams = await RelayTeamModel.findAll({ where: whereClause });
      return relayTeams.map(team => ({
        id: team.id,
        meetId: team.meetId,
        eventId: team.eventId,
        name: team.name,
        swimmers: JSON.parse(team.swimmers || '[]'),
        ageGroup: team.ageGroup,
        gender: team.gender,
      }));
    } catch (error) {
      console.error('Error fetching relay teams:', error);
      return [];
    }
  }

  public async addRelayTeam(team: Omit<RelayTeam, 'id'>): Promise<RelayTeam> {
    await this.ensureInitialized();
    const newTeam: RelayTeam = {
      ...team,
      id: uuidv4(),
    };
    
    try {
      await RelayTeamModel.create({
        id: newTeam.id,
        meetId: newTeam.meetId,
        eventId: newTeam.eventId,
        name: newTeam.name,
        swimmers: JSON.stringify(newTeam.swimmers),
        ageGroup: newTeam.ageGroup,
        gender: newTeam.gender,
      });
      
      return newTeam;
    } catch (error) {
      console.error('Error adding relay team:', error);
      throw error;
    }
  }

  public async updateRelayTeam(id: string, updates: Partial<RelayTeam>): Promise<void> {
    await this.ensureInitialized();
    try {
      const updateData: any = { ...updates };
      
      if (updates.swimmers) {
        updateData.swimmers = JSON.stringify(updates.swimmers);
      }
      
      await RelayTeamModel.update(updateData, { where: { id } });
    } catch (error) {
      console.error('Error updating relay team:', error);
      throw error;
    }
  }

  public async deleteRelayTeam(id: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await RelayTeamModel.destroy({ where: { id } });
    } catch (error) {
      console.error('Error deleting relay team:', error);
      throw error;
    }
  }
}

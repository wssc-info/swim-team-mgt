import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

// Singleton database connection
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private sequelize: Sequelize;
  private isInitialized: boolean = false;

  private constructor() {
    this.sequelize = new Sequelize({
      dialect: "mysql",
      dialectModule: mysql2,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'swim_team_db',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.sequelize.authenticate();
      console.log('Database connection established successfully.');
      
      // Sync all models
      await this.sequelize.sync({ alter: true });
      console.log('Database synchronized successfully.');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (this.isInitialized) {
      await this.sequelize.close();
      this.isInitialized = false;
    }
  }

  public isConnected(): boolean {
    return this.isInitialized;
  }
}

export default DatabaseConnection;

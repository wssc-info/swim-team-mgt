import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import mysql2 from 'mysql2';
// Database configuration
const sequelize = new Sequelize({
  dialect: "mysql",

    dialectModule: mysql2,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'swim_team_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Swimmer Model
interface SwimmerAttributes {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
  selectedEvents: string;
  seedTimes: string;
}

interface SwimmerCreationAttributes extends Optional<SwimmerAttributes, 'id'> {}

export class SwimmerModel extends Model<SwimmerAttributes, SwimmerCreationAttributes> 
  implements SwimmerAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth!: string;
  public gender!: 'M' | 'F';
  public ageGroup!: string;
  public selectedEvents!: string;
  public seedTimes!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SwimmerModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('M', 'F'),
      allowNull: false,
    },
    ageGroup: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    selectedEvents: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    seedTimes: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
    },
  },
  {
    sequelize,
    modelName: 'Swimmer',
    tableName: 'swimmers',
  }
);

// Meet Model
interface MeetAttributes {
  id: string;
  name: string;
  date: string;
  location: string;
  availableEvents: string;
  isActive: boolean;
}

interface MeetCreationAttributes extends Optional<MeetAttributes, 'id'> {}

export class MeetModel extends Model<MeetAttributes, MeetCreationAttributes> 
  implements MeetAttributes {
  public id!: string;
  public name!: string;
  public date!: string;
  public location!: string;
  public availableEvents!: string;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MeetModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    availableEvents: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Meet',
    tableName: 'meets',
  }
);

// RelayTeam Model
interface RelayTeamAttributes {
  id: string;
  eventId: string;
  name: string;
  swimmers: string;
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

interface RelayTeamCreationAttributes extends Optional<RelayTeamAttributes, 'id'> {}

export class RelayTeamModel extends Model<RelayTeamAttributes, RelayTeamCreationAttributes> 
  implements RelayTeamAttributes {
  public id!: string;
  public eventId!: string;
  public name!: string;
  public swimmers!: string;
  public ageGroup!: string;
  public gender!: 'M' | 'F' | 'Mixed';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RelayTeamModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    swimmers: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    ageGroup: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('M', 'F', 'Mixed'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RelayTeam',
    tableName: 'relay_teams',
  }
);

// Initialize database
export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export { sequelize };

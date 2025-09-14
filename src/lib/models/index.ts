import { DataTypes, Model, Optional } from 'sequelize';
import DatabaseConnection from '../db-connection';

const dbConnection = DatabaseConnection.getInstance();
const sequelize = dbConnection.getSequelize();

// Swimmer Model
interface SwimmerAttributes {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  ageGroup: string;
  clubId?: string;
}

type SwimmerCreationAttributes = Optional<SwimmerAttributes, 'id'>

export class SwimmerModel extends Model<SwimmerAttributes, SwimmerCreationAttributes> 
  implements SwimmerAttributes {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare dateOfBirth: string;
  declare gender: 'M' | 'F';
  declare ageGroup: string;
  declare clubId?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
    clubId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'swim_clubs',
        key: 'id'
      }
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

type MeetCreationAttributes = Optional<MeetAttributes, 'id'>

export class MeetModel extends Model<MeetAttributes, MeetCreationAttributes> 
  implements MeetAttributes {
  declare id: string;
  declare name: string;
  declare date: string;
  declare location: string;
  declare availableEvents: string;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
  meetId: string;
  eventId: string;
  name: string;
  swimmers: string;
  ageGroup: string;
  gender: 'M' | 'F' | 'Mixed';
}

type RelayTeamCreationAttributes = Optional<RelayTeamAttributes, 'id'>

export class RelayTeamModel extends Model<RelayTeamAttributes, RelayTeamCreationAttributes> 
  implements RelayTeamAttributes {
  declare id: string;
  declare meetId: string;
  declare eventId: string;
  declare name: string;
  declare swimmers: string;
  declare ageGroup: string;
  declare gender: 'M' | 'F' | 'Mixed';

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RelayTeamModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    meetId: {
      type: DataTypes.STRING,
      allowNull: false,
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

// TimeRecord Model
interface TimeRecordAttributes {
  id: string;
  swimmerId: string;
  eventId: string;
  time: string;
  meetName: string;
  meetDate: string;
  isPersonalBest: boolean;
}

type TimeRecordCreationAttributes = Optional<TimeRecordAttributes, 'id'>

export class TimeRecordModel extends Model<TimeRecordAttributes, TimeRecordCreationAttributes> 
  implements TimeRecordAttributes {
  declare id: string;
  declare swimmerId: string;
  declare eventId: string;
  declare time: string;
  declare meetName: string;
  declare meetDate: string;
  declare isPersonalBest: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TimeRecordModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    swimmerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meetName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meetDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPersonalBest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'TimeRecord',
    tableName: 'time_records',
  }
);

// User Model
interface UserAttributes {
  id: string;
  email: string;
  password: string;
  role: 'coach' | 'family' | 'admin';
  firstName: string;
  lastName: string;
  clubId?: string;
}

type UserCreationAttributes = Optional<UserAttributes, 'id'>

export class UserModel extends Model<UserAttributes, UserCreationAttributes> 
  implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare role: 'coach' | 'family' | 'admin';
  declare firstName: string;
  declare lastName: string;
  declare clubId?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,

    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('coach', 'family', 'admin'),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clubId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'swim_clubs',
        key: 'id'
      }
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

// SwimmerMeetEvent Model
interface SwimmerMeetEventAttributes {
  id: string;
  swimmerId: string;
  meetId: string;
  eventId: string;
  seedTime?: string;
}

type SwimmerMeetEventCreationAttributes = Optional<SwimmerMeetEventAttributes, 'id'>

export class SwimmerMeetEventModel extends Model<SwimmerMeetEventAttributes, SwimmerMeetEventCreationAttributes> 
  implements SwimmerMeetEventAttributes {
  declare id: string;
  declare swimmerId: string;
  declare meetId: string;
  declare eventId: string;
  declare seedTime?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SwimmerMeetEventModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    swimmerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meetId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    seedTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SwimmerMeetEvent',
    tableName: 'swimmer_meet_events',
  }
);

// FamilySwimmerAssociation Model
interface FamilySwimmerAssociationAttributes {
  id: string;
  userId: string;
  swimmerId: string;
}

type FamilySwimmerAssociationCreationAttributes = Optional<FamilySwimmerAssociationAttributes, 'id'>

export class FamilySwimmerAssociationModel extends Model<FamilySwimmerAssociationAttributes, FamilySwimmerAssociationCreationAttributes> 
  implements FamilySwimmerAssociationAttributes {
  declare id: string;
  declare userId: string;
  declare swimmerId: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

FamilySwimmerAssociationModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    swimmerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'FamilySwimmerAssociation',
    tableName: 'family_swimmer_associations',
  }
);

// SwimClub Model
interface SwimClubAttributes {
  id: string;
  name: string;
  abbreviation: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}

type SwimClubCreationAttributes = Optional<SwimClubAttributes, 'id'>

export class SwimClubModel extends Model<SwimClubAttributes, SwimClubCreationAttributes> 
  implements SwimClubAttributes {
  declare id: string;
  declare name: string;
  declare abbreviation: string;
  declare address: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare phone?: string;
  declare email?: string;
  declare website?: string;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SwimClubModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    abbreviation: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'SwimClub',
    tableName: 'swim_clubs',
  }
);

// SwimEvent Model
interface SwimEventAttributes {
  id: string;
  name: string;
  distance: number;
  stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'individual-medley';
  course: 'SCY' | 'LCM' | 'SCM';
  isRelay: boolean;
  ageGroups: string;
  isActive: boolean;
}

type SwimEventCreationAttributes = Optional<SwimEventAttributes, 'id'>

export class SwimEventModel extends Model<SwimEventAttributes, SwimEventCreationAttributes> 
  implements SwimEventAttributes {
  declare id: string;
  declare name: string;
  declare distance: number;
  declare stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'individual-medley';
  declare course: 'SCY' | 'LCM' | 'SCM';
  declare isRelay: boolean;
  declare ageGroups: string;
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SwimEventModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    distance: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stroke: {
      type: DataTypes.ENUM('freestyle', 'backstroke', 'breaststroke', 'butterfly', 'individual-medley'),
      allowNull: false,
    },
    course: {
      type: DataTypes.ENUM('SCY', 'LCM', 'SCM'),
      allowNull: false,
    },
    isRelay: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ageGroups: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'SwimEvent',
    tableName: 'swim_events',
  }
);

// Set up associations
UserModel.belongsTo(SwimClubModel, { foreignKey: 'clubId', as: 'club' });
SwimClubModel.hasMany(UserModel, { foreignKey: 'clubId', as: 'users' });

SwimmerModel.belongsTo(SwimClubModel, { foreignKey: 'clubId', as: 'club' });
SwimClubModel.hasMany(SwimmerModel, { foreignKey: 'clubId', as: 'swimmers' });

// Initialize database function
export async function initializeDatabase() {
  await dbConnection.initialize();
}

export { sequelize, dbConnection };

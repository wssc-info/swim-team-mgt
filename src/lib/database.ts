import {DataTypes, Model, Optional} from 'sequelize';
import DatabaseConnection from "@/lib/db-connection";


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
        sequelize: DatabaseConnection.getInstance().getSequelize(),
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

type RelayTeamCreationAttributes = Optional<RelayTeamAttributes, 'id'>

export class RelayTeamModel extends Model<RelayTeamAttributes, RelayTeamCreationAttributes>
    implements RelayTeamAttributes {
    declare id: string;
    declare eventId: string;
    declare name: string;
    declare swimmers: string;
    declare ageGroup: string;
    declare gender: 'M' | 'F' | 'Mixed';

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

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
        sequelize: DatabaseConnection.getInstance().getSequelize(),
        modelName: 'RelayTeam',
        tableName: 'relay_teams',
    }
);

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
        sequelize: DatabaseConnection.getInstance().getSequelize(),
        modelName: 'TimeRecord',
        tableName: 'time_records',
    }
);

// Initialize database
export async function initializeDatabase() {
    try {
        const sequelize = DatabaseConnection.getInstance().getSequelize();
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync all models
        // await sequelize.sync({alter: true});
        // console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

// export {sequelize};

import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import UserModel from './user.js';
import EventModel from './event.js';

// Initialize models
const User = UserModel(sequelize, DataTypes);
const Event = EventModel(sequelize, DataTypes);

// Define relationships
User.hasMany(Event, { foreignKey: 'createdBy' });
Event.belongsTo(User, { foreignKey: 'createdBy' });

export { sequelize };
export default { User, Event };

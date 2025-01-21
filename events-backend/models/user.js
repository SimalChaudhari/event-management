import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4, // Automatically generates a UUID
        allowNull: false,
        primaryKey: true,
    },
    role: {
        type: DataTypes.ENUM('Admin', 'User'),
        allowNull: false,
        defaultValue: 'User', // Defaults to 'User'
    },

    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: false,
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
    postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: false,
    },

    resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: true,
    },

},
    {
        scopes: {
            withoutPassword: {
                attributes: { exclude: ['password'] },
            },
        },
    }
);

export default User;

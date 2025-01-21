import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const EventRegistration = sequelize.define('EventRegistration', {
    id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4, // Automatically generates a UUID
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Table name for the User model
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'events', // Table name for the Event model
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    role: {
        type: DataTypes.ENUM('Attendee', 'Exhibitor'),
        allowNull: true,
    },
    paymentStatus: {
        type: DataTypes.ENUM('Pending', 'Completed', 'Refunded'),
        allowNull: true,
    },
    invoiceUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    receiptUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    registeredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false, // No automatic createdAt or updatedAt
});

export default EventRegistration;

// events-backend/models/cart.js
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    freezeTableName: true,
    timestamps: true,
});

export default Cart;
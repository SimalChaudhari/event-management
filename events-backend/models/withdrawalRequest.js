import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

const WithdrawalRequest = sequelize.define(
  "WithdrawalRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4, // Automatically generates a UUID
      allowNull: false,
      primaryKey: true,
    },
    registerID: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "RegistraterEvents", // Table name for the User model
        key: "id",
      },
      onDelete: "CASCADE",
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "User", // Table name for the User model
        key: "id",
      },
      onDelete: "CASCADE",
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    document: {
      type: DataTypes.STRING, // Assuming you store the file path or URL
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
  },
  {
    timestamps: false, // No automatic createdAt or updatedAt
  }
);

export default WithdrawalRequest;

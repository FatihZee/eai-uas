const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // koneksi sequelize-mu

const Payment = sequelize.define(
    "Payment",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        order_id: { type: DataTypes.INTEGER, allowNull: false },
        midtrans_order_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        payment_method: { type: DataTypes.STRING },
        status: {
            type: DataTypes.ENUM("pending", "paid", "failed", "cancelled"),
            defaultValue: "pending",
        },
        snap_token: { type: DataTypes.TEXT },
        redirect_url: { type: DataTypes.TEXT },
        transaction_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        tableName: "payments",
        timestamps: false,
    }
);

module.exports = Payment;

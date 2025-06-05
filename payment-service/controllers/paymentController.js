const axios = require('axios');
const snap = require('../config/midtrans');
const Payment = require('../models/paymentModel');

exports.createPayment = async (req, res) => {
    const userId = req.user.id;

    const { order_id } = req.body;

    try {
        // ✅ Cek user
        const userRes = await axios.get(`http://localhost:3001/users/${userId}`);
        if (!userRes.data) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ Cek order
        const orderRes = await axios.get(`http://localhost:3003/orders/${order_id}`);
        if (!orderRes.data) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const midtransOrderId = `ORDER-${order_id}-${Date.now()}`;

        const order = orderRes.data;

        const amount = order.total_price;

        const parameter = {
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: amount,
            },
            customer_details: {
                first_name: userRes.data.name,
                email: userRes.data.email,
            }
        };

        const transaction = await snap.createTransaction(parameter);

        const payment = await Payment.create({
            user_id: userRes.data.id,
            order_id,
            midtrans_order_id: midtransOrderId,
            amount,
            snap_token: transaction.token,
            redirect_url: transaction.redirect_url,
            status: 'pending'
        });

        res.status(201).json({
            message: 'Payment created',
            payment,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({ message: error.response.data.message });
        }

        console.error(error);
        res.status(500).json({ message: 'Failed to create payment', error: error.message });
    }
};

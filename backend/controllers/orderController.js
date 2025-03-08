import { getOrderModel } from '../models/orderModel.js';

export async function createOrder(req, res) {
    const { userId, date, addresses } = req.body;
    if (!userId || !date || !addresses || addresses.length < 2) {
        return res.status(400).json({ error: 'Nedostaju ili nevaljane informacije.' });
    }
    const order = getOrderModel().createOrder(userId, date, addresses);
    res.json(order);
}

let orders = [];

export function getOrderModel() {
    return {
        createOrder(userId, date, addresses) {
            const order = {
                id: orders.length + 1,
                userId,
                date,
                addresses,
                totalDistance: 15.5,
                totalPrice: 7.75
            };
            orders.push(order);
            return order;
        },
        getOrders() {
            return orders;
        }
    };
}
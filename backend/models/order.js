import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const Order = {
  findByUserId: (userId, callback) => {
    db.all(
      `
      SELECT o.*, c.name as client_name, c.address as client_address
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.user_id = ?
      `,
      [userId],
      callback
    );
  },
  create: (orderData, callback) => {
    const {
      user_id,
      client_id,
      date,
      warehouse_address,
      destination,
      weight,
      dimensions,
    } = orderData;

    if (!client_id || !date || !warehouse_address || !destination || !weight || !dimensions) {
      return callback(new Error('Sva polja su obavezna'));
    }

    // Hardkodirana udaljenost i cijena za sada
    const distance = 18.999;
    const price = distance * 0.433;

    // Ograničenja kombija
    const maxWeight = 1500; // kg
    const maxLength = 400; // cm
    const maxWidth = 180; // cm
    const maxHeight = 190; // cm
    const maxVolume = maxLength * maxWidth * maxHeight; // cm³

    // Parsiraj dimenzije (DxŠxV)
    const [length, width, height] = dimensions.split('x').map(Number);
    const packageVolume = length * width * height; // cm³

    // Izračunaj kapacitet
    const maxPackagesByWeight = Math.floor(maxWeight / weight); // Koliko paketa stane po težini
    const maxPackagesByVolume = Math.floor(maxVolume / packageVolume); // Koliko paketa stane po volumenu
    const maxPackages = Math.min(maxPackagesByWeight, maxPackagesByVolume); // Uzmi manji broj

    // Provjeri zadovoljavaju li dimenzije ograničenja
    const fitsDimensions =
      length <= maxLength &&
      width <= maxWidth &&
      height <= maxHeight;

    const capacityInfo = {
      maxPackages: fitsDimensions ? maxPackages : 0,
      fitsDimensions,
      exceedsWeight: weight > maxWeight,
      exceedsVolume: packageVolume > maxVolume,
    };

    const unique_id = `TRN-${user_id}-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const orderDataWithExtras = {
      user_id,
      client_id,
      unique_id,
      date,
      warehouse_address,
      destination,
      weight,
      dimensions,
      distance,
      price,
      capacity_info: JSON.stringify(capacityInfo),
    };

    db.run(
      `
      INSERT INTO orders (user_id, client_id, unique_id, date, warehouse_address, destination, weight, dimensions, distance, price, capacity_info, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id,
        client_id,
        unique_id,
        date,
        warehouse_address,
        destination,
        weight,
        dimensions,
        distance,
        price,
        orderDataWithExtras.capacity_info,
        'pending',
      ],
      function (err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, { id: this.lastID, ...orderDataWithExtras });
      }
    );
  },
  updateStatus: (orderId, status, callback) => {
    db.run(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId],
      callback
    );
  },
};

export default Order;
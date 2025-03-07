const express = require('express');
const router = express.Router();
const axios = require('axios');

// Dummy baza narudžbi (privremeno rješenje)
const orders = [];

// API ključ za Google Maps
const apiKey = 'AIzaSyCS8w-5RCU31pqF5wBosKcPgvgWJUfeboM';

// Funkcija za pretvaranje adresa u latitude i longitude s validacijom
async function getLatLng(address) {
  if (!address || typeof address !== 'string' || address.trim().length < 3) {
    throw new Error('Adresa nije valjana ili je prekratka: ' + address);
  }
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    params: {
      address: address.trim(),
      key: apiKey
    }
  });

  const data = response.data;
  console.log('Geocoding API response za adresu', address, ':', data);

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error('Nije moguće dobiti koordinata za adresu: ' + address + ' (Status: ' + data.status + ')');
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}

// API za kreiranje nove narudžbe
router.post('/create', async (req, res) => {
  const { userId, date, addresses } = req.body;

  if (!userId || !date || !addresses || !Array.isArray(addresses) || addresses.length < 2) {
    console.log("❌ Nedostaju ili nevaljane informacije za narudžbu.", { userId, date, addresses });
    return res.status(400).json({ error: 'Nedostaju ili nevaljane informacije za narudžbu.' });
  }

  try {
    // Pretvaranje adresa u latLng formu s validacijom
    const latLngAddresses = await Promise.all(addresses.map(addr => getLatLng(addr)));

    // Postavi origin na prvu adresu, destination na posljednju, a intermediates na srednje adrese
    const intermediates = latLngAddresses.slice(1, -1).map(latLng => ({
      location: { latLng }
    }));
    const requestBody = {
      origin: { location: { latLng: latLngAddresses[0] } },
      destination: { location: { latLng: latLngAddresses[latLngAddresses.length - 1] } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      intermediates: intermediates.length > 0 ? intermediates : undefined, // Ukloni intermediates ako je prazan
      languageCode: 'hr',
      units: 'METRIC'
    };

    console.log('Šaljem zahtjev s requestBody:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
        }
      }
    );

    const routeData = response.data;

    if (!routeData.routes || routeData.routes.length === 0) {
      console.log("❌ Nema dostupnih ruta od Google API-ja. Response:", JSON.stringify(routeData));
      return res.status(500).json({ error: 'Nema dostupnih ruta.' });
    }

    // Izračunaj ukupnu udaljenost
    const totalDistance = routeData.routes[0].distanceMeters / 1000; // U kilometrima

    // Povratak u Zagreb (prva adresa) s povlaštenom tarifom
    const returnRequestBody = {
      origin: { location: { latLng: latLngAddresses[latLngAddresses.length - 1] } },
      destination: { location: { latLng: latLngAddresses[0] } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: 'hr',
      units: 'METRIC'
    };

    console.log('Šaljem zahtjev za povratak s requestBody:', JSON.stringify(returnRequestBody, null, 2));

    const returnResponse = await axios.post(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      returnRequestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters'
        }
      }
    );

    const returnRouteData = returnResponse.data;
    if (!returnRouteData.routes || returnRouteData.routes.length === 0) {
      console.log("❌ Nema dostupnih ruta za povratak. Response:", JSON.stringify(returnRouteData));
      return res.status(500).json({ error: 'Nema dostupnih ruta za povratak.' });
    }

    const returnDistance = returnRouteData.routes[0].distanceMeters / 1000; // U kilometrima
    const totalDistanceWithReturn = totalDistance + returnDistance * 0.6; // Povlaštena tarifa za povratak

    // Izračun cijene
    const pricePerKm = 0.5;
    const returnPricePerKm = 0.3;
    const totalPrice = (totalDistance * pricePerKm) + (returnDistance * returnPricePerKm * 0.6);

    // Spremanje narudžbe u dummy bazu
    const newOrder = {
      id: orders.length + 1,
      userId,
      date,
      addresses: addresses.slice(1),
      totalDistance: totalDistanceWithReturn,
      totalPrice
    };
    orders.push(newOrder);

    console.log("✅ Narudžba uspješno spremljena:", newOrder);
    res.json({ message: 'Narudžba uspješno kreirana!', totalDistance: totalDistanceWithReturn, totalPrice });
  } catch (err) {
    console.error('❌ Greška prilikom slanja zahtjeva:', err.message);
    if (err.response) {
      console.error('Detalji greške:', err.response.data);
    }
    res.status(500).json({ error: 'Greška prilikom kreiranja narudžbe: ' + (err.response ? JSON.stringify(err.response.data) : err.message) });
  }
});

module.exports = router;
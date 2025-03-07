const express = require('express');
const router = express.Router();
const axios = require('axios');

// Dummy baza narudžbi (privremeno rješenje)
const orders = [];

// API ključ za Google Maps
const apiKey = 'AIzaSyB1mNQAD7JEoVAib3xjNlP_1DNIrlEHeiU';

// Funkcija za pretvaranje adresa u latitude i longitude
async function getLatLng(address) {
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    params: {
      address,
      key: apiKey
    }
  });

  const data = response.data;

  if (data.status !== "OK" || !data.results || data.results.length === 0) {
    throw new Error('Nije moguće dobiti koordinata za adresu: ' + address);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}

// API za kreiranje nove narudžbe
router.post('/create', async (req, res) => {
  const { userId, date, addresses } = req.body;

  if (!userId || !date || !addresses || addresses.length < 2) {
    console.log("❌ Nedostaju potrebne informacije za narudžbu.");
    return res.status(400).json({ error: 'Nedostaju potrebne informacije za narudžbu.' });
  }

  try {
    // Pretvaranje adresa u latLng formu
    const latLngAddresses = await Promise.all(addresses.map(getLatLng));

    // Postavi origin na prvu adresu, destination na posljednju, a intermediates na srednje adrese
    const intermediates = latLngAddresses.slice(1, -1).map(latLng => ({
      location: { latLng }
    }));
    const requestBody = {
      origin: { location: { latLng: latLngAddresses[0] } },
      destination: { location: { latLng: latLngAddresses[latLngAddresses.length - 1] } }, // Posljednja adresa
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      intermediates: intermediates,
      optimizeWaypointOrder: true,
      languageCode: 'hr',
      units: 'METRIC'
    };

    // Ispisujemo JSON zahtjev u točnom formatu za provjeru
    console.log("📤 Šaljem zahtjev Google Routes API-ju s ovim podacima:", JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.optimizedWaypointOrder'
        }
      }
    );

    const routeData = response.data;

    if (!routeData.routes || routeData.routes.length === 0) {
      console.log("❌ Nema dostupnih ruta od Google API-ja.");
      return res.status(500).json({ error: 'Nema dostupnih ruta.' });
    }

    // Izračunaj ukupnu udaljenost
    const totalDistance = routeData.routes[0].distanceMeters / 1000; // U kilometrima

    // Povratak u Zagreb (prva adresa) s povlaštenom tarifom
    const returnRequestBody = {
      origin: { location: { latLng: latLngAddresses[latLngAddresses.length - 1] } },
      destination: { location: { latLng: latLngAddresses[0] } }, // Povratak u Zagreb
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: 'hr',
      units: 'METRIC'
    };

    const returnResponse = await axios.post(
      `https://routes.googleapis.com/directions/v2:computeRoutes`,
      returnRequestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
        }
      }
    );

    const returnRouteData = returnResponse.data;
    if (!returnRouteData.routes || returnRouteData.routes.length === 0) {
      console.log("❌ Nema dostupnih ruta za povratak.");
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
      addresses: routeData.routes[0].optimizedWaypointOrder
        ? routeData.routes[0].optimizedWaypointOrder.map(index => addresses[index + 1]) // Preskoči prvu adresu
        : addresses.slice(1), // Ako nema optimizacije, uzmi adrese kakve jesu
      totalDistance: totalDistanceWithReturn,
      totalPrice
    };
    orders.push(newOrder);

    console.log("✅ Narudžba uspješno spremljena:", newOrder);
    res.json({ message: 'Narudžba uspješno kreirana!', totalDistance: totalDistanceWithReturn, totalPrice });
  } catch (err) {
    console.error('❌ Greška prilikom slanja zahtjeva:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Greška prilikom kreiranja narudžbe.' });
  }
});

module.exports = router;
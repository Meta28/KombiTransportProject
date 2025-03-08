const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

try {
    require('axios');
} catch (error) {
    console.error('❌ Greška: axios modul nije instaliran. Pokrenite "npm install axios".');
    process.exit(1);
}

// Dummy baza narudžbi (privremeno rješenje)
const orders = [];

// API ključ za Google Maps iz .env
const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('❌ Greška: GOOGLE_API_KEY nije definiran u .env datoteci!');
    process.exit(1); // Prekini izvođenje ako ključ nije pronađen
}

console.log('🔑 Koristi se API ključ:', apiKey);

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
    console.log('Geocoding API response za adresu', address, ':', JSON.stringify(data, null, 2));

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.error('Geocoding API greška:', data.error_message || 'Nepoznata greška');
        throw new Error('Nije moguće dobiti koordinata za adresu: ' + address + ' (Status: ' + data.status + ', Poruka: ' + (data.error_message || 'Nema dodatnih detalja') + ')');
    }

    const { lat, lng } = data.results[0].geometry.location;
    console.log(`📍 Koordinate za adresu ${address}: lat = ${lat}, lng = ${lng}`);
    return { latitude: lat, longitude: lng };
}

// API za kreiranje nove narudžbe
router.post('/create', async (req, res) => {
    const { userId, date, addresses } = req.body;

    if (!userId || !date || !addresses || !Array.isArray(addresses) || addresses.length < 2) {
        console.log("❌ Nedostaju ili nevaljane informacije za narudžbu.", { userId, date, addresses });
        return res.status(400).json({ error: 'Nedostaju ili nevaljane informacije za narudžbu (minimalno 2 adrese).'});
    }

    try {
        // Pretvaranje adresa u latLng formu s validacijom
        const latLngAddresses = await Promise.all(addresses.map(getLatLng));

        // Postavi origin na prvu adresu, destination na posljednju, a intermediates na sve ostale
        const intermediates = latLngAddresses.slice(1, -1).map(latLng => ({
            location: { latLng }
        }));
        if (intermediates.length <= 1) {
            console.log('Upozorenje: Imamo samo jedan ili nijedan intermediate waypoint. Optimizacija možda neće raditi.');
        }

        const requestBody = {
            origin: { location: { latLng: latLngAddresses[0] } },
            destination: { location: { latLng: latLngAddresses[latLngAddresses.length - 1] } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            intermediates: intermediates,
            optimizeWaypointOrder: true,
            languageCode: 'hr',
            units: 'METRIC'
        };

        console.log('📤 Šaljem zahtjev Google Routes API-ju s ovim podacima:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `https://routes.googleapis.com/directions/v2:computeRoutes`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndices,routes.waypointOrder,routes.intermediateWaypointIndices'
                }
            }
        );

        const routeData = response.data;
        console.log('Routes API puni odgovor:', JSON.stringify(routeData, null, 2));

        if (!routeData.routes || routeData.routes.length === 0) {
            console.log("❌ Nema dostupnih ruta od Google API-ja. Response:", JSON.stringify(routeData));
            return res.status(500).json({ error: 'Nema dostupnih ruta. Provjerite adrese ili API ključ.' });
        }

        // Provjera optimiziranog redoslijeda
        let optimizedOrder = routeData.routes[0].optimizedIntermediateWaypointIndices || routeData.routes[0].waypointOrder || [];
        if (optimizedOrder.length === 0 || !Array.isArray(optimizedOrder)) {
            console.log('Optimizacija nije dostupna ili neispravna, vraćam originalni redoslijed adresa.');
            optimizedOrder = Array.from({ length: intermediates.length }, (_, i) => i);
        } else {
            console.log('Optimizirani redoslijed waypointova:', optimizedOrder);
        }

        // Kreiranje optimiziranog niza adresa
        const optimizedAddresses = [
            addresses[0], // Origin (skladište)
            ...optimizedOrder.map(index => addresses[index + 1]), // Intermediates
            addresses[addresses.length - 1] // Destination
        ];

        const totalDistance = routeData.routes[0].distanceMeters / 1000;

        // Provjera povratka
        const returnRequestBody = {
            origin: { location: { latLng: latLngAddresses[latLngAddresses.length - 1] } },
            destination: { location: { latLng: latLngAddresses[0] } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            languageCode: 'hr',
            units: 'METRIC'
        };

        console.log('📤 Šaljem zahtjev za povratak s ovim podacima:', JSON.stringify(returnRequestBody, null, 2));

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

        const returnDistance = returnRouteData.routes[0].distanceMeters / 1000;
        const totalDistanceWithReturn = totalDistance + returnDistance * 0.6;

        const pricePerKm = 0.5;
        const returnPricePerKm = 0.3;
        const totalPrice = (totalDistance * pricePerKm) + (returnDistance * returnPricePerKm * 0.6);

        const newOrder = {
            id: orders.length + 1,
            userId,
            date,
            addresses: optimizedAddresses,
            totalDistance: totalDistanceWithReturn,
            totalPrice
        };
        orders.push(newOrder);

        console.log("✅ Narudžba uspješno spremljena:", newOrder);
        res.json({ message: 'Narudžba uspješno kreirana!', totalDistance: totalDistanceWithReturn, totalPrice, optimizedAddresses });
    } catch (err) {
        console.error('❌ Greška prilikom slanja zahtjeva:', err.message);
        if (err.response) {
            console.error('Detalji greške s punim odgovorom:', JSON.stringify(err.response.data, null, 2));
        }
        res.status(500).json({ error: 'Greška prilikom kreiranja narudžbe. Provjerite unesene adrese ili kontaktirajte podršku. Detalji: ' + (err.response ? JSON.stringify(err.response.data, null, 2) : err.message) });
    }
});

module.exports = router;
const express = require('express');
const app = express();
const port = 5001;
const axios = require('axios');
const cors = require('cors');

// Omogući CORS
app.use(cors());
app.use(express.json());

// API ključ (NE dijeli ga javno)
const apiKey = 'AIzaSyB1mNQAD7JEoVAib3xjNlP_1DNIrlEHeiU';

// Proxy endpoint za Google Routes API
app.post('/api/route', async (req, res) => {
    const { origins, destinations } = req.body;

    if (!origins || !destinations || destinations.length < 2) {
        return res.status(400).json({ error: 'Origins i barem dvije destinacije su potrebne' });
    }

    // Pripremi `intermediates` s ispravnim formatom
    const intermediates = destinations.slice(1, -1).map(location => ({
        waypoint: {
            location: {
                address: location
            }
        }
    }));

    const requestBody = {
        origin: {
            address: destinations[0]
        },
        destination: {
            address: destinations[destinations.length - 1]
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        intermediates: intermediates,
        languageCode: 'hr',
        units: 'METRIC'
    };

    console.log('📤 Šaljem zahtjev Google Routes API-ju s ovim podacima:', requestBody);

    try {
        const response = await axios.post(
            'https://routes.googleapis.com/directions/v2:computeRoutes',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
                }
            }
        );

        console.log('📬 Odgovor od API-ja:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Greška prilikom slanja zahtjeva:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

// Pokreni server
app.listen(port, () => {
    console.log(`Server je pokrenut na http://localhost:${port}`);
});

export function initForm() {
    const addAddressBtn = document.getElementById('addAddress');
    const form = document.getElementById('deliveryForm');
    const resultDiv = document.getElementById('result');
    const historyDiv = document.getElementById('history');
    const showHistoryBtn = document.getElementById('showHistory');
    const viewCostsBtn = document.getElementById('viewCosts');
    let ordersHistory = [];

    function initAutocomplete() {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.error('Google Maps API nije učitan ili Places API nije dostupan.');
            resultDiv.innerHTML = 'Greška: Google Places API nije dostupan.';
            return;
        }

        const inputs = document.getElementsByClassName('address-input');
        for (let i = 0; i < inputs.length; i++) {
            const autocomplete = new google.maps.places.Autocomplete(inputs[i], {
                types: ['address'],
                componentRestrictions: { country: 'hr' }
            });
            autocomplete.input = inputs[i];
            autocomplete.addListener('place_changed', function() {
                const place = this.getPlace();
                if (!place.geometry) {
                    console.log('Nema detalja o lokaciji za:', place.name);
                    return;
                }
                this.input.value = place.formatted_address;
            });
        }
    }

    addAddressBtn.addEventListener('click', function() {
        const addressFields = document.getElementById('addressFields');
        const addressCount = addressFields.getElementsByClassName('address-field').length - 2;
        const newAddressField = document.createElement('div');
        newAddressField.className = 'address-field';
        newAddressField.innerHTML = `
            <label>Odredišna adresa ${addressCount + 1}:</label><br>
            <input type="text" class="address-input" placeholder="npr. Ulica ${addressCount + 2}, Rijeka" required>
        `;
        addressFields.appendChild(newAddressField);
        initAutocomplete();
    });

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        resultDiv.innerHTML = 'Učitavanje...';

        const customerName = document.getElementById('customerName').value;
        const warehouse = document.getElementById('warehouse').value;
        const addressInputs = document.getElementsByClassName('address-input');
        const addresses = [warehouse];
        for (let i = 2; i < addressInputs.length; i++) {
            if (addressInputs[i].value.trim()) {
                addresses.push(addressInputs[i].value);
            }
        }

        if (addresses.length < 2) {
            resultDiv.innerHTML = 'Unesite minimalno 2 adrese.';
            return;
        }

        const selectedDate = calendarInstance.getSelectedDate();
        if (!selectedDate) {
            resultDiv.innerHTML = 'Molimo odaberite datum prije potvrde narudžbe.';
            return;
        }

        const isUrgent = document.getElementById('urgentDelivery').checked;
        const baseDistance = 15.5;
        const basePrice = 7.75;
        const totalPrice = isUrgent ? basePrice * 1.5 : basePrice;

        const mockResponse = {
            message: 'Narudžba uspješno kreirana (simulacija)!',
            customerName: customerName,
            optimizedAddresses: addresses,
            totalDistance: baseDistance,
            totalPrice: totalPrice
        };

        ordersHistory.push({
            date: selectedDate,
            customer: customerName,
            addresses: addresses,
            distance: baseDistance,
            price: totalPrice,
            urgent: isUrgent
        });

        const optimizedRoute = mockResponse.optimizedAddresses.join(' -> ');
        resultDiv.innerHTML = `Narudžba:<br>Kupac: ${mockResponse.customerName}<br>Datum: ${selectedDate}<br>Optimizirana ruta: ${optimizedRoute}<br>Ukupna udaljenost: ${mockResponse.totalDistance.toFixed(2)} km<br>Cijena dostave: ${mockResponse.totalPrice.toFixed(2)} EUR${isUrgent ? '<br><strong>Hitna dostava!</strong>' : ''}<br><em>(Napomena: Ovo je simulirani odgovor dok čekamo API aktivaciju)</em>`;

        form.reset();
    });

    showHistoryBtn.addEventListener('click', function() {
        if (historyDiv.style.display === 'none') {
            const historyContent = ordersHistory.map((order, index) => `
                <div class="history-item">
                    <strong>Narudžba ${index + 1}</strong><br>
                    Datum: ${order.date}<br>
                    Kupac: ${order.customer}<br>
                    Ruta: ${order.addresses.join(' -> ')}<br>
                    Udaljenost: ${order.distance.toFixed(2)} km<br>
                    Cijena: ${order.price.toFixed(2)} EUR${order.urgent ? '<br><strong>Hitna dostava!</strong>' : ''}
                </div>
            `).join('<hr>');
            historyDiv.innerHTML = `<h3>Povijest narudžbi</h3>${historyContent}`;
            historyDiv.style.display = 'block';
        } else {
            historyDiv.style.display = 'none';
        }
    });

    viewCostsBtn.addEventListener('click', function() {
        const totalCost = ordersHistory.reduce((sum, order) => sum + order.price, 0);
        resultDiv.innerHTML = `Ukupni troškovi dostava: ${totalCost.toFixed(2)} EUR<br><em>(Bazirano na simuliranim podacima)</em>`;
    });

    return { initAutocomplete };
}

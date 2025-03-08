import { validateOrderForm, showNotification } from './utils.js';

// Funkcija za prikaz forme za transport
export function showOrderForm() {
    document.getElementById('pageTitle').textContent = 'Naruči transport';
    document.getElementById('welcomeMessage').style.display = 'none';
    document.getElementById('calendar').style.display = 'block';
    document.getElementById('deliveryForm').style.display = 'block';
    document.getElementById('history').style.display = 'none';
    document.getElementById('clients').style.display = 'none';
    document.getElementById('invoices').style.display = 'none';
}

// Funkcija za dodavanje adrese dostave
export function setupAddAddressButton() {
    document.getElementById('addAddress').addEventListener('click', function() {
        const deliveryDetails = document.getElementById('deliveryDetails');
        const addressIndex = deliveryDetails.children.length + 1;
        const newField = document.createElement('div');
        newField.className = 'address-field';
        newField.innerHTML = `
            <label>Adresa dostave ${addressIndex}:</label><br>
            <input type="text" class="address-input" placeholder="Unesite adresu" required>
            <label>Kilaza (kg):</label><br>
            <input type="number" class="address-input" placeholder="Unesite kilazu" min="0">
            <label>Dimenzije (cm):</label><br>
            <input type="text" class="address-input" placeholder="Unesite dimenzije">
            <label>Artikl:</label><br>
            <input type="text" class="address-input" placeholder="Unesite artikl">
            <label>SKU:</label><br>
            <input type="text" class="address-input" placeholder="Unesite SKU">
        `;
        deliveryDetails.appendChild(newField);
    });
}

// Funkcija za slanje transporta
export function setupOrderSubmission(calendar) {
    let selectedDate = null;

    // Postavljanje odabira datuma
    calendar.on('dateClick', function(info) {
        selectedDate = info.dateStr;
        document.getElementById('deliveryDate').value = selectedDate;
        showNotification('Datum dostave odabran: ' + selectedDate);
    });

    document.getElementById('deliveryForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const customerName = document.getElementById('customerName').value;
        const customerOIB = document.getElementById('customerOIB').value;
        const customerAddress = document.getElementById('customerAddress').value;
        const warehouse = document.getElementById('warehouse').value;
        const urgentDelivery = document.getElementById('urgentDelivery').checked;
        const deliveryDetails = document.getElementById('deliveryDetails');
        const addresses = [];

        for (let i = 0; i < deliveryDetails.children.length; i++) {
            const inputs = deliveryDetails.children[i].getElementsByTagName('input');
            addresses.push({
                address: inputs[0].value,
                weight: parseFloat(inputs[1].value) || 0,
                dimensions: inputs[2].value,
                article: inputs[3].value,
                sku: inputs[4].value
            });
        }

        // Validacija prije slanja
        const validationError = validateOrderForm(customerName, warehouse, selectedDate, addresses);
        if (validationError) {
            showNotification(validationError);
            return;
        }

        const formData = {
            customerName,
            customerOIB,
            customerAddress,
            warehouse,
            deliveryDate: selectedDate,
            urgentDelivery,
            addresses,
            executorName: 'Kombi Transport d.o.o.', // Primjer, zamijeni stvarnim podacima
            executorOIB: '12345678901', // Primjer OIB, zamijeni stvarnim
            executorAddress: 'Ulica Primjera 1, 10000 Zagreb' // Primjer, zamijeni stvarnim
        };
        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message);
            document.getElementById('result').innerText = `Transport spremljen s ID-om: ${data.orderId}`;
            if (data.invoice) {
                displayInvoice(data.invoice);
            } else if (data.invoiceError) {
                showNotification('Greška pri generiranju fakture: ' + data.invoiceError);
            }
            calendar.refetchEvents();
            document.getElementById('deliveryForm').reset();
            deliveryDetails.innerHTML = '';
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri spremanju transporta');
        });
    });
}

// Funkcija za prikaz fakture
function displayInvoice(invoice) {
    const invoiceInfo = document.getElementById('invoiceInfo');
    invoiceInfo.innerHTML = `
        <p><strong>Broj fakture:</strong> ${invoice.invoiceNumber || 'N/A'}</p>
        <p><strong>Datum izdavanja:</strong> ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Rok plaćanja:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Naručitelj:</strong> ${invoice.customerName || 'N/A'}, OIB: ${invoice.customerOIB || 'N/A'}, Adresa: ${invoice.customerAddress || 'N/A'}</p>
        <p><strong>Izvšitelj:</strong> ${invoice.executorName || 'N/A'}, OIB: ${invoice.executorOIB || 'N/A'}, Adresa: ${invoice.executorAddress || 'N/A'}</p>
        <p><strong>Usluga:</strong> ${invoice.serviceDescription || 'N/A'}</p>
        <p><strong>Iznos bez PDV-a:</strong> ${invoice.amountWithoutVAT ? invoice.amountWithoutVAT.toFixed(2) : '0.00'} EUR</p>
        <p><strong>Stopa PDV-a:</strong> ${invoice.vatRate ? (invoice.vatRate * 100) + '%' : 'N/A'}</p>
        <p><strong>Iznos PDV-a:</strong> ${invoice.vatAmount ? invoice.vatAmount.toFixed(2) : '0.00'} EUR</p>
        <p><strong>Ukupni iznos:</strong> ${invoice.totalAmount ? invoice.totalAmount.toFixed(2) : '0.00'} EUR</p>
        <p><strong>Poziv na broj:</strong> ${invoice.paymentReference || 'N/A'}</p>
    `;
    document.getElementById('invoiceDetails').style.display = 'block';
}

// Funkcija za autocompletiranje klijenata
export function setupAutocomplete() {
    const customerNameInput = document.getElementById('customerName');
    const suggestions = document.getElementById('suggestions');

    customerNameInput.addEventListener('input', function() {
        const query = customerNameInput.value;
        if (query.length < 2) {
            suggestions.style.display = 'none';
            return;
        }
        fetch(`/api/clients/search?name=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(clients => {
                suggestions.innerHTML = '';
                if (clients.length > 0) {
                    suggestions.style.display = 'block';
                    clients.forEach(client => {
                        const div = document.createElement('div');
                        div.textContent = `${client.name} (${client.phone || 'N/A'}, ${client.address || 'N/A'})`;
                        div.addEventListener('click', () => {
                            customerNameInput.value = client.name;
                            document.getElementById('customerAddress').value = client.address || '';
                            suggestions.style.display = 'none';
                        });
                        suggestions.appendChild(div);
                    });
                } else {
                    suggestions.style.display = 'none';
                }
            })
            .catch(error => console.error('Greška pri pretraživanju:', error));
    });

    document.addEventListener('click', function(e) {
        if (!customerNameInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}
import { initializeCalendar } from './calendar.js';
import { showOrderForm, setupAddAddressButton, setupOrderSubmission, setupAutocomplete } from './orderForm.js';
import { setupHistory } from './history.js';
import { setupClients } from './clients.js';
import { setupCosts } from './costs.js';
import { showNotification } from './utils.js'; // Dodajemo uvoz showNotification

document.addEventListener('DOMContentLoaded', function() {
    let selectedOrderId = null;

    // Inicijalizacija kalendara
    const calendarEl = document.getElementById('calendar');
    const calendar = initializeCalendar(
        calendarEl,
        // Callback za klik na događaj
        function(info) {
            selectedOrderId = info.event.id;
            fetch(`/api/orders/${selectedOrderId}`)
                .then(response => response.json())
                .then(order => {
                    const modal = document.getElementById('modal');
                    const modalDetails = document.getElementById('modalDetails');
                    modalDetails.innerHTML = `
                        <p><strong>ID:</strong> ${order.id}</p>
                        <p><strong>Kupac:</strong> ${order.customerName}</p>
                        <p><strong>Skladište:</strong> ${order.warehouse}</p>
                        <p><strong>Datum dostave:</strong> ${order.deliveryDate}</p>
                        <p><strong>Detalji adresa:</strong></p>
                        ${order.details.map(d => `
                            <p>- Adresa: ${d.address}, Kilaza: ${d.weight}kg, Dimenzije: ${d.dimensions || 'N/A'}, Artikl: ${d.article || 'N/A'}, SKU: ${d.sku || 'N/A'}</p>
                        `).join('')}
                        <p><strong>Hitno:</strong> ${order.urgentDelivery ? 'Da' : 'Ne'}</p>
                        <p><strong>Kreirano:</strong> ${order.createdAt}</p>
                    `;
                    modal.style.display = 'block';
                })
                .catch(error => console.error('Greška:', error));
        },
        null
    );

    // Zatvaranje modala
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('modal').style.display = 'none';
    });

    // Postavljanje funkcionalnosti aplikacije
    if (window.location.pathname === '/naruci-transport') {
        showOrderForm();
        calendar.render();
    }

    setupAddAddressButton();
    setupOrderSubmission(calendar);
    setupAutocomplete();
    setupHistory();
    setupClients();
    setupCosts();

    // Prikaz popisa faktura
    document.getElementById('showInvoices').addEventListener('click', function() {
        fetch('/api/invoices')
            .then(response => response.json())
            .then(invoices => {
                const invoicesDiv = document.getElementById('invoices');
                invoicesDiv.innerHTML = '<h3>Popis faktura</h3>' + invoices.map(invoice => `
                    <p>ID: ${invoice.id}, Broj fakture: ${invoice.invoiceNumber}, Kupac: ${invoice.customerName}, Ukupni iznos: ${invoice.totalAmount.toFixed(2)} EUR, Kreirano: ${invoice.createdAt}</p>
                `).join('');
                invoicesDiv.style.display = 'block';
                document.getElementById('deliveryForm').style.display = 'none';
                document.getElementById('history').style.display = 'none';
                document.getElementById('clients').style.display = 'none';
                document.getElementById('calendar').style.display = 'none';
            })
            .catch(error => {
                console.error('Greška:', error);
                showNotification('Greška pri dohvaćanju faktura');
            });
    });

    // Inicijalni prikaz za početnu stranicu
    window.showOrderForm = showOrderForm;
});
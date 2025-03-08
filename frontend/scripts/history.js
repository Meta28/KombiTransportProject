import { showNotification } from './utils.js';

// Funkcija za prikaz povijesti transporta
export function setupHistory() {
    document.querySelector('#showHistory').addEventListener('click', function() {
        fetch('/api/orders')
            .then(response => response.json())
            .then(orders => {
                const historyDiv = document.getElementById('history');
                historyDiv.innerHTML = '<h3>Povijest transporta</h3>' + orders.map(order => `
                    <p>ID: ${order.id}, Kupac: ${order.customerName}, Skladište: ${order.warehouse}, Datum dostave: ${order.deliveryDate}, Kreirano: ${order.createdAt}</p>
                    ${order.details.map(d => `
                        <p>- Adresa: ${d.address}, Kilaza: ${d.weight}kg, Dimenzije: ${d.dimensions || 'N/A'}, Artikl: ${d.article || 'N/A'}, SKU: ${d.sku || 'N/A'}</p>
                    `).join('')}
                `).join('');
                historyDiv.style.display = 'block';
                document.getElementById('deliveryForm').style.display = 'none';
                document.getElementById('clients').style.display = 'none';
                document.getElementById('calendar').style.display = 'none';
            })
            .catch(error => {
                console.error('Greška:', error);
                showNotification('Greška pri dohvaćanju povijesti');
            });
    });
}
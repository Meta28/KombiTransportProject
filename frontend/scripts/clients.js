import { showNotification } from './utils.js';

// Funkcija za prikaz i upravljanje klijentima
export function setupClients() {
    document.getElementById('showClients').addEventListener('click', function() {
        fetch('/api/clients')
            .then(response => response.json())
            .then(clients => {
                const clientsDiv = document.getElementById('clients');
                clientsDiv.innerHTML = '<h3>Popis klijenata</h3>' + clients.map(client => `
                    <p>ID: ${client.id}, Ime: ${client.name}, Telefon: ${client.phone || 'N/A'}, Adresa: ${client.address || 'N/A'}, Kreirano: ${client.createdAt}</p>
                `).join('');
                clientsDiv.style.display = 'block';
                document.getElementById('deliveryForm').style.display = 'none';
                document.getElementById('history').style.display = 'none';
                document.getElementById('calendar').style.display = 'none';
            })
            .catch(error => {
                console.error('Greška:', error);
                showNotification('Greška pri dohvaćanju klijenata');
            });
    });

    document.getElementById('addClient').addEventListener('click', function() {
        const name = prompt('Unesite ime klijenta:');
        const phone = prompt('Unesite telefon klijenta:');
        const email = prompt('Unesite email klijenta:');
        const address = prompt('Unesite adresu klijenta:');
        if (name) {
            fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email, address })
            })
            .then(response => response.json())
            .then(data => {
                showNotification(data.message);
                document.getElementById('showClients').click(); // Osvježi popis
            })
            .catch(error => {
                console.error('Greška:', error);
                showNotification('Greška pri kreiranju klijenta');
            });
        }
    });
}
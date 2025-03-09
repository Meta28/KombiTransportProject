import { initializeCalendar } from './calendar.js';
import { showOrderForm, setupAddAddressButton, setupOrderSubmission, setupAutocomplete } from './orderForm.js';
import { setupHistory } from './history.js';
import { setupClients } from './clients.js';
import { setupCosts } from './costs.js';
import { showNotification } from './utils.js';

// Funkcije za prebacivanje sučelja
function switchToExecutor() {
    document.getElementById('executorInterface').style.display = 'block';
    document.getElementById('clientInterface').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('sidebar').style.display = 'block';
    localStorage.setItem('token', 'dummy-token-for-dev'); // Simuliraj token za testiranje
    initializeExecutorInterface();
}

function switchToClient() {
    document.getElementById('clientInterface').style.display = 'block';
    document.getElementById('executorInterface').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('sidebar').style.display = 'block';
    localStorage.setItem('token', 'dummy-token-for-dev'); // Simuliraj token za testiranje
    initializeClientInterface();
}

// Sučelje za naručitelja
function initializeClientInterface() {
    document.getElementById('clientInterface').style.display = 'block';
    document.getElementById('executorInterface').style.display = 'none';

    document.getElementById('sidebarMenu').innerHTML = `
        <li><a href="#" id="showClientOrders">Moji transporti</a></li>
        <li><a href="#" id="showClientNewOrder" onclick="showOrderForm()">Novi transport</a></li>
        <li><a href="#" id="showClientInvoices">Moje fakture</a></li>
        <li><a href="#" id="logout">Odjava</a></li>
    `;

    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        const calendar = initializeCalendar(calendarEl, {
            initialView: 'dayGridMonth',
            dateClick: function(info) {
                document.getElementById('deliveryDate').value = info.dateStr;
                showOrderForm();
            }
        });
        if (calendar && typeof calendar.render === 'function') {
            calendar.render();
        } else {
            console.error('Calendar nije ispravno inicijaliziran:', calendar);
        }
    }

    setupAddAddressButton();
    setupOrderSubmission();
    setupAutocomplete();

    document.getElementById('showClientOrders').addEventListener('click', function() {
        fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri dohvaćanju transporta: ${response.status}`);
            return response.json();
        })
        .then(orders => {
            const ordersDiv = document.getElementById('clientOrders');
            ordersDiv.innerHTML = '<h3>Moji transporti</h3>' + orders.map(order => `
                <p>ID: ${order.id}, Kupac: ${order.customerName}, Datum dostave: ${order.deliveryDate}, Status: ${order.status}, Kreirano: ${order.createdAt}</p>
            `).join('');
            ordersDiv.style.display = 'block';
            document.getElementById('deliveryForm').style.display = 'none';
            document.getElementById('calendar').style.display = 'none';
            document.getElementById('clientInvoices').style.display = 'none';
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri dohvaćanju transporta');
        });
    });

    document.getElementById('showClientInvoices').addEventListener('click', function() {
        fetch('/api/invoices', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri dohvaćanju faktura: ${response.status}`);
            return response.json();
        })
        .then(invoices => {
            const invoicesDiv = document.getElementById('clientInvoices');
            invoicesDiv.innerHTML = '<h3>Moje fakture</h3>' + invoices.map(invoice => `
                <p>ID: ${invoice.id}, Broj fakture: ${invoice.invoiceNumber}, Kupac: ${invoice.customerName}, Ukupni iznos: ${invoice.totalAmount.toFixed(2)} EUR, Kreirano: ${invoice.createdAt}</p>
            `).join('');
            invoicesDiv.style.display = 'block';
            document.getElementById('deliveryForm').style.display = 'none';
            document.getElementById('calendar').style.display = 'none';
            document.getElementById('clientOrders').style.display = 'none';
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri dohvaćanju faktura');
        });
    });

    setupLogout();
}

// Sučelje za izvršitelja
function initializeExecutorInterface() {
    document.getElementById('executorInterface').style.display = 'block';
    document.getElementById('clientInterface').style.display = 'none';

    document.getElementById('sidebarMenu').innerHTML = `
        <li><a href="#" id="showExecutorOrders">Svi transporti</a></li>
        <li><a href="#" id="showExecutorClients">Klijenti</a></li>
        <li><a href="#" id="showExecutorInvoices">Fakture</a></li>
        <li><a href="#" id="logout">Odjava</a></li>
    `;

    document.getElementById('showExecutorOrders').addEventListener('click', function() {
        fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri dohvaćanju transporta: ${response.status}`);
            return response.json();
        })
        .then(orders => {
            const ordersDiv = document.getElementById('executorOrders');
            ordersDiv.innerHTML = '<h3>Svi transporti</h3>' + orders.map(order => `
                <p>ID: ${order.id}, Kupac: ${order.customerName}, Datum dostave: ${order.deliveryDate}, Status: ${order.status}, Kreirano: ${order.createdAt}
                ${order.status === 'pending' ? `
                    <button onclick="acceptOrder(${order.id})">Prihvati</button>
                    <button onclick="rejectOrder(${order.id})">Odbij</button>
                ` : ''}
                </p>
            `).join('');
            ordersDiv.style.display = 'block';
            document.getElementById('executorClients').style.display = 'none';
            document.getElementById('executorInvoices').style.display = 'none';
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri dohvaćanju transporta');
        });
    });

    document.getElementById('showExecutorClients').addEventListener('click', function() {
        fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri dohvaćanju klijenata: ${response.status}`);
            return response.json();
        })
        .then(clients => {
            const clientsDiv = document.getElementById('executorClients');
            clientsDiv.innerHTML = '<h3>Klijenti</h3>' + clients.map(client => `
                <p>Ime: ${client.name}, Telefon: ${client.phone || 'N/A'}, Email: ${client.email || 'N/A'}, Adresa: ${client.address || 'N/A'}</p>
            `).join('');
            clientsDiv.style.display = 'block';
            document.getElementById('executorOrders').style.display = 'none';
            document.getElementById('executorInvoices').style.display = 'none';
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri dohvaćanju klijenata');
        });
    });

    document.getElementById('showExecutorInvoices').addEventListener('click', function() {
        fetch('/api/invoices', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri dohvaćanju faktura: ${response.status}`);
            return response.json();
        })
        .then(invoices => {
            const invoicesDiv = document.getElementById('executorInvoices');
            invoicesDiv.innerHTML = '<h3>Fakture</h3>' + invoices.map(invoice => `
                <p>ID: ${invoice.id}, Broj fakture: ${invoice.invoiceNumber}, Kupac: ${invoice.customerName}, Ukupni iznos: ${invoice.totalAmount.toFixed(2)} EUR, Kreirano: ${invoice.createdAt}</p>
            `).join('');
            invoicesDiv.style.display = 'block';
            document.getElementById('executorOrders').style.display = 'none';
            document.getElementById('executorClients').style.display = 'none';
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri dohvaćanju faktura');
        });
    });

    window.acceptOrder = function(orderId) {
        fetch(`/api/orders/${orderId}/accept`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri prihvaćanju: ${response.status}`);
            return response.json();
        })
        .then(data => {
            showNotification(data.message);
            document.getElementById('showExecutorOrders').click();
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri prihvaćanju narudžbe');
        });
    };

    window.rejectOrder = function(orderId) {
        fetch(`/api/orders/${orderId}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Greška pri odbijanju: ${response.status}`);
            return response.json();
        })
        .then(data => {
            showNotification(data.message);
            document.getElementById('showExecutorOrders').click();
        })
        .catch(error => {
            console.error('Greška:', error);
            showNotification('Greška pri odbijanju narudžbe');
        });
    };

    function setupLogout() {
        document.getElementById('logout').addEventListener('click', function() {
            localStorage.removeItem('token');
            document.getElementById('executorInterface').style.display = 'none';
            document.getElementById('clientInterface').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('sidebar').style.display = 'none';
        });
    }
}

// Početna inicijalizacija
document.addEventListener('DOMContentLoaded', function() {
    let token = localStorage.getItem('token');

    document.getElementById('switchToExecutorBtn').addEventListener('click', switchToExecutor);
    document.getElementById('switchToClientBtn').addEventListener('click', switchToClient);

    if (!token) {
        document.getElementById('loginForm').style.display = 'block';
    } else {
        initializeApp();
    }

    window.login = function() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Prijava nije uspjela: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                console.log('Token spremljen:', data.token);
                document.getElementById('loginForm').style.display = 'none';
                initializeApp();
            } else {
                showNotification(data.error || 'Pogreška pri prijavi');
            }
        })
        .catch(error => {
            console.error('Greška pri prijavi:', error);
            showNotification('Greška pri prijavi: ' + error.message);
        });
    };

    function initializeApp() {
        const token = localStorage.getItem('token');
        console.log('Token uzet iz localStorage:', token);

        if (!token) {
            console.error('Token nije pronađen u localStorage');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('sidebar').style.display = 'none';
            return;
        }

        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Greška pri dohvaćanju profila: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.user && data.user.role) {
                const role = data.user.role;
                document.getElementById('sidebar').style.display = 'block';
                if (role === 'client') {
                    initializeClientInterface();
                } else if (role === 'executor' || role === 'admin') {
                    initializeExecutorInterface();
                }
            } else {
                throw new Error('Nepotpuni podaci o korisniku: role nije definiran');
            }
        })
        .catch(error => {
            console.error('Greška pri dohvaćanju profila:', error);
            showNotification('Greška pri dohvaćanju profila: ' + error.message);
            localStorage.removeItem('token');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('sidebar').style.display = 'none';
        });
    }

    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('modal').style.display = 'none';
    });
});
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
    localStorage.setItem('token', 'dummy-token-for-dev');
    initializeExecutorInterface();
}

function switchToClient() {
    document.getElementById('clientInterface').style.display = 'block';
    document.getElementById('executorInterface').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('sidebar').style.display = 'block';
    localStorage.setItem('token', 'dummy-token-for-dev');
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
        }
    }

    setupAddAddressButton();
    setupOrderSubmission();
    setupAutocomplete();

    document.getElementById('showClientOrders').addEventListener('click', function() {
        fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        .then(response => response.json())
        .then(orders => {
            const ordersDiv = document.getElementById('clientOrders');
            ordersDiv.innerHTML = '<h3>Moji transporti</h3>' + orders.map(order => `
                <p>ID: ${order.id}, Kupac: ${order.customerName}, Datum dostave: ${order.deliveryDate}</p>
            `).join('');
            ordersDiv.style.display = 'block';
        })
        .catch(error => console.error('Greška:', error));
    });

    document.getElementById('showClientInvoices').addEventListener('click', function() {
        // Implementacija za fakture
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
        .then(response => response.json())
        .then(orders => {
            const ordersDiv = document.getElementById('executorOrders');
            ordersDiv.innerHTML = '<h3>Svi transporti</h3>' + orders.map(order => `
                <p>ID: ${order.id}, Kupac: ${order.customerName}, Datum dostave: ${order.deliveryDate}</p>
            `).join('');
            ordersDiv.style.display = 'block';
        })
        .catch(error => console.error('Greška:', error));
    });

    document.getElementById('showExecutorClients').addEventListener('click', function() {
        // Implementacija za klijente
    });

    document.getElementById('showExecutorInvoices').addEventListener('click', function() {
        // Implementacija za fakture
    });

    setupLogout();
}

function setupLogout() {
    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem('token');
        document.getElementById('executorInterface').style.display = 'none';
        document.getElementById('clientInterface').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('sidebar').style.display = 'none';
    });
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
        if (!response.ok) throw new Error('Prijava nije uspjela');
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            document.getElementById('loginForm').style.display = 'none';
            initializeApp();
        } else {
            alert('Pogrešno korisničko ime ili lozinka');
        }
    })
    .catch(error => console.error('Greška:', error));
};

function initializeApp() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error('Greška pri dohvaćanju profila');
            return response.json();
        })
        .then(data => {
            document.getElementById('sidebar').style.display = 'block';
            if (data.user.role === 'client') {
                initializeClientInterface();
            } else if (data.user.role === 'executor' || data.user.role === 'admin') {
                initializeExecutorInterface();
            }
        })
        .catch(error => console.error('Greška:', error));
    }
}

// Početna inicijalizacija
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('switchToExecutorBtn').addEventListener('click', switchToExecutor);
    document.getElementById('switchToClientBtn').addEventListener('click', switchToClient);
    initializeApp();
});
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for the login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', window.login);
    }

    const calendarEl = document.getElementById('calendar');
    if (calendarEl && typeof FullCalendar !== 'undefined') {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            selectable: true,
            select: function(info) {
                alert('Odabrali ste datum: ' + info.startStr);
            }
        });
        calendar.render();
    } else {
        console.error('FullCalendar nije dostupan ili nije ispravno učitan. Provjerite /lib/fullcalendar.min.js.');
    }

    // Login funkcija
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

    function initializeClientInterface() {
        document.getElementById('clientInterface').style.display = 'block';
        document.getElementById('executorInterface').style.display = 'none';
        document.getElementById('sidebarMenu').innerHTML = `
            <li><a href="#" id="showClientOrders">Moji transporti</a></li>
            <li><a href="#" id="showClientNewOrder">Novi transport</a></li>
            <li><a href="#" id="showClientInvoices">Moje fakture</a></li>
            <li><a href="#" id="logout">Odjava</a></li>
        `;
        document.getElementById('showClientOrders').addEventListener('click', () => {
            fetch('/api/orders', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
                .then(response => response.json())
                .then(orders => {
                    const ordersDiv = document.getElementById('clientOrders');
                    ordersDiv.innerHTML = '<h3>Moji transporti</h3>' + orders.map(order => `<p>ID: ${order.id}, Kupac: ${order.customerName}</p>`).join('');
                    ordersDiv.style.display = 'block';
                })
                .catch(error => console.error('Greška:', error));
        });
        document.getElementById('showClientNewOrder').addEventListener('click', showOrderForm);
        document.getElementById('logout').addEventListener('click', () => {
            localStorage.removeItem('token');
            location.reload();
        });
    }

    function initializeExecutorInterface() {
        document.getElementById('executorInterface').style.display = 'block';
        document.getElementById('clientInterface').style.display = 'none';
        document.getElementById('sidebarMenu').innerHTML = `
            <li><a href="#" id="showExecutorOrders">Svi transporti</a></li>
            <li><a href="#" id="showExecutorClients">Klijenti</a></li>
            <li><a href="#" id="showExecutorInvoices">Fakture</a></li>
            <li><a href="#" id="logout">Odjava</a></li>
        `;
        document.getElementById('showExecutorOrders').addEventListener('click', () => {
            fetch('/api/orders', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
                .then(response => response.json())
                .then(orders => {
                    const ordersDiv = document.getElementById('executorOrders');
                    ordersDiv.innerHTML = '<h3>Svi transporti</h3>' + orders.map(order => `<p>ID: ${order.id}, Kupac: ${order.customerName}</p>`).join('');
                    ordersDiv.style.display = 'block';
                })
                .catch(error => console.error('Greška:', error));
        });
        document.getElementById('logout').addEventListener('click', () => {
            localStorage.removeItem('token');
            location.reload();
        });
    }

    function showOrderForm() {
        document.getElementById('deliveryForm').style.display = 'block';
    }

    document.getElementById('switchToExecutorBtn').addEventListener('click', initializeExecutorInterface);
    document.getElementById('switchToClientBtn').addEventListener('click', initializeClientInterface);
});
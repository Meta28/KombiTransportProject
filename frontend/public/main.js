document.addEventListener('DOMContentLoaded', () => {
    // Inicijalizacija kalendara
    const calendarEl = document.getElementById('calendar');
    if (calendarEl && typeof FullCalendar !== 'undefined') {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            weekends: true,
            selectable: true,
            select: function(info) {
                alert('Odabrali ste datum: ' + info.startStr);
            }
        });
        calendar.render();
    } else {
        console.error('FullCalendar nije dostupan ili nije ispravno učitan. Provjerite /lib/fullcalendar.min.js.');
    }

    // Login funkcionalnost
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', window.login);
    }

    window.login = function() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        console.log('Pokretanje prijave s korisničkim imenom:', username);

        fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            console.log('Odgovor od /api/login - Status:', response.status);
            if (!response.ok) throw new Error('Prijava nije uspjela s kodom: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('Podaci od /api/login:', data);
            if (data.token) {
                localStorage.setItem('token', data.token);
                console.log('Token spremljen u localStorage:', data.token);
                document.getElementById('loginForm').style.display = 'none';
                initializeApp(data.token);
            } else {
                alert('Pogrešno korisničko ime ili lozinka');
            }
        })
        .catch(error => {
            console.error('Greška tijekom prijave:', error);
            alert('Greška tijekom prijave: ' + error.message);
        });
    };

    function initializeApp(token) {
        console.log('Pokretanje initializeApp s tokenom:', token);

        fetch('http://localhost:5001/api/profile', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log('Odgovor od /api/profile - Status:', response.status);
            if (!response.ok) throw new Error('Greška pri dohvaćanju profila s kodom: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('Podaci od /api/profile:', data);
            if (data.user && data.user.role) {
                document.getElementById('sidebar').style.display = 'block';
                if (data.user.role === 'client') {
                    initializeClientInterface();
                } else if (data.user.role === 'executor' || data.user.role === 'admin') {
                    initializeExecutorInterface();
                } else {
                    console.error('Nepoznata uloga korisnika:', data.user.role);
                    localStorage.removeItem('token');
                    document.getElementById('loginForm').style.display = 'block';
                }
            } else {
                console.error('Podaci o korisniku nisu ispravni:', data);
                localStorage.removeItem('token');
                document.getElementById('loginForm').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Greška pri dohvaćanju profila:', error);
            alert('Greška pri dohvaćanju profila: ' + error.message);
            localStorage.removeItem('token');
            document.getElementById('loginForm').style.display = 'block';
        });
    }

    function initializeClientInterface() {
        console.log('Pokretanje initializeClientInterface');
        document.getElementById('clientInterface').style.display = 'block';
        document.getElementById('executorInterface').style.display = 'none';
        document.getElementById('sidebarMenu').innerHTML = `
            <li><a href="#" id="showClientOrders">Moji transporti</a></li>
            <li><a href="#" id="showClientNewOrder">Novi transport</a></li>
            <li><a href="#" id="showClientInvoices">Moje fakture</a></li>
            <li><a href="#" id="logout">Odjava</a></li>
        `;
        document.getElementById('showClientOrders').addEventListener('click', () => {
            fetch('http://localhost:5001/api/orders', { 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                } 
            })
                .then(response => response.json())
                .then(orders => {
                    const ordersDiv = document.getElementById('clientOrders');
                    ordersDiv.innerHTML = '<h3>Moji transporti</h3>' + orders.map(order => `<p>ID: ${order.id}, Kupac: ${order.customerName}</p>`).join('');
                    ordersDiv.style.display = 'block';
                })
                .catch(error => console.error('Greška:', error));
        });
        document.getElementById('showClientNewOrder').addEventListener('click', showOrderForm);
        document.getElementById('deliveryFormSubmit').addEventListener('submit', submitOrder);
        document.getElementById('logout').addEventListener('click', () => {
            localStorage.removeItem('token');
            location.reload();
        });
    }

    function initializeExecutorInterface() {
        console.log('Pokretanje initializeExecutorInterface');
        document.getElementById('executorInterface').style.display = 'block';
        document.getElementById('clientInterface').style.display = 'none';
        document.getElementById('sidebarMenu').innerHTML = `
            <li><a href="#" id="showExecutorOrders">Svi transporti</a></li>
            <li><a href="#" id="showExecutorClients">Klijenti</a></li>
            <li><a href="#" id="showExecutorInvoices">Fakture</a></li>
            <li><a href="#" id="logout">Odjava</a></li>
        `;
        document.getElementById('showExecutorOrders').addEventListener('click', () => {
            fetch('http://localhost:5001/api/orders', { 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                } 
            })
                .then(response => response.json())
                .then(orders => {
                    const ordersDiv = document.getElementById('executorOrders');
                    ordersDiv.innerHTML = '<h3>Svi transporti</h3>' + orders.map(order => `<p>ID: ${order.id}, Kupac: ${order.customerName}</p>`).join('');
                    ordersDiv.style.display = 'block';
                })
                .catch(error => console.error('Greška:', error));
        });
        document.getElementById('showExecutorClients').addEventListener('click', () => {
            console.log('Prikaz klijenata');
        });
        document.getElementById('showExecutorInvoices').addEventListener('click', () => {
            console.log('Prikaz faktura');
        });
        document.getElementById('logout').addEventListener('click', () => {
            localStorage.removeItem('token');
            location.reload();
        });
    }

    function showOrderForm() {
        document.getElementById('deliveryForm').style.display = 'block';
    }

    function submitOrder(event) {
        event.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Morate se prijaviti za slanje narudžbe.');
            return;
        }

        const orderData = {
            deliveryDate: document.getElementById('deliveryDate').value,
            customerName: document.getElementById('customerName').value,
            customerOIB: document.getElementById('customerOIB').value,
            customerAddress: document.getElementById('customerAddress').value,
            warehouse: document.getElementById('warehouse').value,
            urgentDelivery: document.getElementById('urgentDelivery').checked
        };

        fetch('http://localhost:5001/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            console.log('Odgovor od /api/orders - Status:', response.status);
            if (!response.ok) throw new Error('Slanje narudžbe nije uspjelo s kodom: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('Podaci od /api/orders:', data);
            document.getElementById('formMessage').innerHTML = '<p style="color: green;">Narudžba uspješno poslana!</p>';
            document.getElementById('deliveryFormSubmit').reset();
            setTimeout(() => {
                document.getElementById('formMessage').innerHTML = '';
            }, 3000);
        })
        .catch(error => {
            console.error('Greška pri slanju narudžbe:', error);
            document.getElementById('formMessage').innerHTML = '<p style="color: red;">Greška pri slanju narudžbe.</p>';
            setTimeout(() => {
                document.getElementById('formMessage').innerHTML = '';
            }, 3000);
        });
    }

    document.getElementById('switchToExecutorBtn').addEventListener('click', initializeExecutorInterface);
    document.getElementById('switchToClientBtn').addEventListener('click', initializeClientInterface);
});
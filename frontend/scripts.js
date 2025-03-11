let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user'));

function showSection(section) {
  const sections = [
    'login', 'register', 'profile', 'orderTransport', 'clients', 'orders',
    'historyDone', 'historyCanceled', 'historyInProgress'
  ];
  sections.forEach((s) => {
    document.getElementById(`${s}-section`).style.display = s === section ? 'block' : 'none';
  });

  if (section === 'orderTransport' && token) {
    // Inicijalizacija flatpickr samo kada je sekcija vidljiva
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
      flatpickr(datePicker, {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: new Date("2025-03-10"), // Koristimo Date objekt za siguran format
        onReady: function(selectedDates, dateStr, instance) {
          if (!datePicker.value) {
            instance.setDate(new Date("2025-03-10"));
          }
        }
      });
    }

    if (typeof addNextPackage === 'function' && packageCount === 0) addNextPackage();
    if (typeof loadClientsForSelect === 'function') loadClientsForSelect(1);
    if (typeof loadWarehouseAddressesForSelect === 'function') loadWarehouseAddressesForSelect(1);
  } else if (section === 'clients' && token) {
    if (typeof loadClientList === 'function') loadClientList();
  } else if (section === 'orders' && token) {
    if (typeof loadPendingOrders === 'function') loadPendingOrders();
  } else if (section === 'historyDone' && token) {
    if (typeof loadHistory === 'function') loadHistory('completed');
  } else if (section === 'historyCanceled' && token) {
    if (typeof loadHistory === 'function') loadHistory('canceled');
  } else if (section === 'historyInProgress' && token) {
    if (typeof loadHistory === 'function') loadHistory('pending');
  } else if (section === 'profile' && token) {
    if (typeof loadProfile === 'function') loadProfile();
  }
}

if (token && currentUser) {
  showSection('orderTransport');
} else {
  showSection('login');
}

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const company_name = document.getElementById('registerCompanyName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const address = document.getElementById('registerAddress').value;
  const warehouseAddressesInput = document.getElementById('registerWarehouseAddresses').value.split('\n').filter(a => a.trim());
  const warehouse_addresses = warehouseAddressesInput.map(addr => ({ address: addr.trim(), default: warehouseAddressesInput.indexOf(addr) === 0 }));

  fetch('http://localhost:5001/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name, email, password, address, warehouse_addresses }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        alert('Registracija uspješna! Sada se možete prijaviti.');
        showSection('login');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Došlo je do greške prilikom registracije.');
    });
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  fetch('http://localhost:5001/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        showSection('orderTransport');
        if (typeof addNextPackage === 'function' && packageCount === 0) addNextPackage();
        if (typeof loadClientsForSelect === 'function') loadClientsForSelect(1);
        if (typeof loadWarehouseAddressesForSelect === 'function') loadWarehouseAddressesForSelect(1);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Došlo je do greške prilikom prijave.');
    });
});

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showSection('login');
}

function loadProfile() {
  document.getElementById('profileCompanyName').value = currentUser.company_name;
  document.getElementById('profileAddress').value = currentUser.address;
  document.getElementById('profileWarehouseAddresses').value = currentUser.warehouse_addresses.map(addr => addr.address).join('\n');
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const company_name = document.getElementById('profileCompanyName').value;
  const address = document.getElementById('profileAddress').value;
  const warehouseAddressesInput = document.getElementById('profileWarehouseAddresses').value.split('\n').filter(a => a.trim());
  const warehouse_addresses = warehouseAddressesInput.map((addr, index) => ({ address: addr.trim(), default: index === 0 }));

  fetch('http://localhost:5001/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ company_name, address, warehouse_addresses }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        currentUser.company_name = data.company_name;
        currentUser.address = data.address;
        currentUser.warehouse_addresses = data.warehouse_addresses;
        localStorage.setItem('user', JSON.stringify(currentUser));
        alert('Profil ažuriran!');
        if (typeof loadWarehouseAddressesForSelect === 'function') loadWarehouseAddressesForSelect(1);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Došlo je do greške prilikom ažuriranja profila.');
    });
});
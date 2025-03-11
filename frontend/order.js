let packages = [];
let packageCount = 0;

function loadClientsForSelect(packageIndex) {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  fetch('http://localhost:5001/api/clients', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Unexpected data format');
      const clientSelect = document.getElementById(`client_${packageIndex}`);
      if (!clientSelect) {
        console.error(`Element with ID 'client_${packageIndex}' not found`);
        return;
      }
      clientSelect.innerHTML = '<option value="" disabled selected>Odaberite postojećeg klijenta ili unesite novog</option>';
      data.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name} (${client.address})`;
        option.dataset.address = client.address;
        clientSelect.appendChild(option);
      });

      // Event listener za promjenu klijenta
      clientSelect.addEventListener('change', () => {
        const selectedOption = clientSelect.options[clientSelect.selectedIndex];
        const destinationInput = document.getElementById(`destination_${packageIndex}`);
        const differentAddressCheckbox = document.getElementById(`differentAddress_${packageIndex}`);
        const destinationContainer = document.getElementById(`destinationContainer_${packageIndex}`);
        if (destinationInput && destinationContainer && differentAddressCheckbox) {
          if (selectedOption.value) {
            destinationInput.value = selectedOption.dataset.address;
            destinationContainer.style.display = 'none';
            destinationInput.removeAttribute('required');
            differentAddressCheckbox.checked = false;
          } else {
            destinationInput.value = '';
            destinationContainer.style.display = 'none';
            destinationInput.removeAttribute('required');
            differentAddressCheckbox.checked = false;
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching clients:', error);
      alert('Došlo je do greške prilikom dohvaćanja klijenata. Provjerite je li server pokrenut.');
    });
}

function loadWarehouseAddressesForSelect(packageIndex) {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  fetch('http://localhost:5001/api/users/warehouse-addresses', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Unexpected data format');
      const warehouseSelect = document.getElementById(`warehouse_${packageIndex}`);
      if (!warehouseSelect) {
        console.error(`Element with ID 'warehouse_${packageIndex}' not found`);
        return;
      }
      warehouseSelect.innerHTML = '<option value="" disabled selected>Odaberite skladište</option>';
      data.forEach(addr => {
        const option = document.createElement('option');
        option.value = addr.address;
        option.textContent = addr.address;
        warehouseSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error fetching warehouse addresses:', error);
      alert('Došlo je do greške prilikom dohvaćanja adresa skladišta. Provjerite je li server pokrenut.');
    });
}

function toggleNewClient(packageIndex) {
  const newClientDiv = document.getElementById(`newClient_${packageIndex}`);
  const clientSelect = document.getElementById(`client_${packageIndex}`);
  const destinationInput = document.getElementById(`destination_${packageIndex}`);
  const differentAddressCheckbox = document.getElementById(`differentAddress_${packageIndex}`);
  const destinationContainer = document.getElementById(`destinationContainer_${packageIndex}`);
  const newClientNameInput = document.getElementById(`newClientName_${packageIndex}`);
  const newClientAddressInput = document.getElementById(`newClientAddress_${packageIndex}`);

  if (newClientDiv && clientSelect && destinationInput && differentAddressCheckbox && destinationContainer && newClientNameInput && newClientAddressInput) {
    if (newClientDiv.style.display === 'none') {
      newClientDiv.style.display = 'block';
      clientSelect.value = '';
      destinationInput.value = '';
      destinationContainer.style.display = 'none';
      destinationInput.removeAttribute('required');
      differentAddressCheckbox.checked = false;
      newClientNameInput.setAttribute('required', 'required');
      newClientAddressInput.setAttribute('required', 'required');
    } else {
      newClientDiv.style.display = 'none';
      destinationInput.value = '';
      destinationContainer.style.display = 'none';
      destinationInput.removeAttribute('required');
      differentAddressCheckbox.checked = false;
      newClientNameInput.removeAttribute('required');
      newClientAddressInput.removeAttribute('required');
    }
  } else {
    console.error('One or more elements not found for packageIndex:', packageIndex);
  }
}

function addNextPackage() {
  packageCount++;
  const container = document.getElementById('packagesContainer');
  if (!container) {
    console.error('packagesContainer not found');
    return;
  }
  const newPackage = document.createElement('div');
  newPackage.className = 'card mb-3';
  newPackage.innerHTML = `
    <div class="card-body">
      <h2>Paket ${packageCount}</h2>
      <form id="packageForm_${packageCount}">
        <div class="mb-3">
          <label class="form-label">Klijent:</label>
          <select id="client_${packageCount}" class="form-select mb-2" required>
            <option value="" disabled selected>Odaberite postojećeg klijenta ili unesite novog</option>
          </select>
          <div id="newClient_${packageCount}" style="display: none;">
            <input type="text" id="newClientName_${packageCount}" class="form-control mb-2" placeholder="Ime klijenta">
            <input type="text" id="newClientAddress_${packageCount}" class="form-control" placeholder="Adresa klijenta">
          </div>
          <button type="button" class="btn btn-secondary mb-2" onclick="toggleNewClient(${packageCount})">Unesi novog klijenta</button>
        </div>
        <div class="mb-3">
          <label for="warehouse_${packageCount}" class="form-label">Skladište (polazna točka):</label>
          <select id="warehouse_${packageCount}" class="form-select" required>
            <option value="" disabled selected>Odaberite skladište</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-check-label">
            <input type="checkbox" id="differentAddress_${packageCount}" class="form-check-input">
            Adresa dostave je različita od adrese računa
          </label>
          <div id="destinationContainer_${packageCount}" style="display: none;">
            <label for="destination_${packageCount}" class="form-label">Odredišna adresa:</label>
            <input type="text" id="destination_${packageCount}" class="form-control">
          </div>
        </div>
        <div class="mb-3">
          <label for="weight_${packageCount}" class="form-label">Težina paketa (kg):</label>
          <input type="number" id="weight_${packageCount}" class="form-control" step="0.01" required>
        </div>
        <div class="mb-3">
          <label for="dimensions_${packageCount}" class="form-label">Dimenzije paketa (DxŠxV u cm):</label>
          <input type="text" id="dimensions_${packageCount}" class="form-control" placeholder="npr. 50x30x20" required>
        </div>
        <button type="submit" class="btn btn-success">Potvrdi paket</button>
        ${packageCount > 1 ? '<button type="button" class="btn btn-danger mt-2" onclick="removePackage(this)">Ukloni paket</button>' : ''}
        ${packageCount === 1 ? '<button type="button" class="btn btn-primary mt-2" onclick="addNextPackage()">Dodaj sljedeći paket</button>' : ''}
      </form>
    </div>
  `;
  container.appendChild(newPackage);
  loadClientsForSelect(packageCount);
  loadWarehouseAddressesForSelect(packageCount);

  // Dodaj event listener za checkbox "Adresa dostave je različita"
  const differentAddressCheckbox = document.getElementById(`differentAddress_${packageCount}`);
  const destinationContainer = document.getElementById(`destinationContainer_${packageCount}`);
  const destinationInput = document.getElementById(`destination_${packageCount}`);
  if (differentAddressCheckbox && destinationContainer && destinationInput) {
    differentAddressCheckbox.addEventListener('change', () => {
      if (differentAddressCheckbox.checked) {
        destinationContainer.style.display = 'block';
        destinationInput.setAttribute('required', 'required');
      } else {
        destinationContainer.style.display = 'none';
        destinationInput.removeAttribute('required');
        const clientSelect = document.getElementById(`client_${packageIndex}`);
        if (clientSelect) {
          const selectedOption = clientSelect.options[clientSelect.selectedIndex];
          destinationInput.value = selectedOption && selectedOption.value ? selectedOption.dataset.address : '';
        }
      }
    });
  }

  document.getElementById(`packageForm_${packageCount}`).addEventListener('submit', (e) => {
    e.preventDefault();
    const client_id = document.getElementById(`client_${packageCount}`)?.value;
    let newClient = null;

    if (!client_id && !document.getElementById(`newClient_${packageCount}`).style.display === 'none') {
      console.error('No client selected and new client form is not visible');
      return;
    }

    if (document.getElementById(`newClient_${packageCount}`).style.display !== 'none') {
      const newClientName = document.getElementById(`newClientName_${packageCount}`).value.trim();
      const newClientAddress = document.getElementById(`newClientAddress_${packageCount}`).value.trim();
      if (newClientName && newClientAddress) {
        fetch('http://localhost:5001/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: newClientName, address: newClientAddress }),
        })
          .then(response => response.json())
          .then(data => {
            if (data.error) alert(data.error);
            else {
              newClient = data;
              const destinationInput = document.getElementById(`destination_${packageCount}`);
              const differentAddressCheckbox = document.getElementById(`differentAddress_${packageCount}`);
              if (destinationInput && differentAddressCheckbox) {
                if (!differentAddressCheckbox.checked) {
                  destinationInput.value = newClient.address;
                }
                savePackage(packageCount, newClient.id || client_id);
              }
            }
          })
          .catch(error => {
            console.error('Error creating new client:', error);
            alert('Došlo je do greške prilikom dodavanja novog klijenta.');
          });
      } else {
        alert('Molimo unesite ime i adresu novog klijenta!');
      }
    } else {
      savePackage(packageCount, client_id);
    }
  });
}

function removePackage(button) {
  const packageDiv = button.closest('.card');
  const packageIndex = parseInt(packageDiv.querySelector('h2').textContent.replace('Paket ', ''));
  packageDiv.remove();
  packages = packages.filter(p => p.index !== packageIndex);
  updateSummary();
}

function savePackage(packageIndex, client_id) {
  const date = document.getElementById('datePicker')?.value.trim();
  const warehouse_address = document.getElementById(`warehouse_${packageIndex}`)?.value.trim();
  const destinationInput = document.getElementById(`destination_${packageIndex}`);
  const differentAddressCheckbox = document.getElementById(`differentAddress_${packageIndex}`);
  const destination = (destinationInput && differentAddressCheckbox) ? (differentAddressCheckbox.checked ? destinationInput.value.trim() : destinationInput.value.trim()) : '';
  const weight = document.getElementById(`weight_${packageIndex}`)?.value.trim();
  const dimensions = document.getElementById(`dimensions_${packageIndex}`)?.value.trim();

  // Provjeri jesu li sva polja popunjena
  if (!client_id || !date || !warehouse_address || !destination || !weight || !dimensions) {
    alert('Molimo popunite sva obavezna polja!');
    return;
  }

  // Provjeri jesu li numerička polja ispravna
  if (isNaN(weight) || parseFloat(weight) <= 0) {
    alert('Težina paketa mora biti pozitivan broj!');
    return;
  }

  const dimensionsArray = dimensions.split('x').map(d => parseFloat(d.trim()));
  if (dimensionsArray.length !== 3 || dimensionsArray.some(d => isNaN(d) || d <= 0)) {
    alert('Dimenzije paketa moraju biti u formatu DxŠxV (npr. 50x30x20) i sve vrijednosti moraju biti pozitivni brojevi!');
    return;
  }

  const packageData = {
    client_id,
    date,
    warehouse_address,
    destination,
    weight,
    dimensions,
  };
  packages.push({ index: packageIndex, ...packageData });
  document.getElementById(`packageForm_${packageIndex}`).reset();
  document.getElementById(`newClient_${packageIndex}`).style.display = 'none';
  if (differentAddressCheckbox) {
    differentAddressCheckbox.checked = false;
    document.getElementById(`destinationContainer_${packageIndex}`).style.display = 'none';
  }
  updateSummary();
}

function updateSummary() {
  const summary = document.getElementById('summary');
  const orderSummary = document.getElementById('orderSummary');
  if (!summary || !orderSummary) {
    console.error('Summary or orderSummary element not found');
    return;
  }
  orderSummary.innerHTML = '';
  let totalPrice = 0;

  packages.forEach((pkg, index) => {
    const capacity = {
      fitsDimensions: true,
      exceedsWeight: pkg.weight > 1500,
      exceedsVolume: false,
      maxPackages: pkg.weight <= 1500 ? Math.floor(1500 / pkg.weight) : 0,
    };
    let capacityText = '<h5>Kapacitet kombija:</h5>';
    if (!capacity.fitsDimensions) {
      capacityText += '<div class="alert alert-danger">Dimenzije paketa premašuju ograničenja kombija (400x180x190 cm).</div>';
    } else if (capacity.exceedsWeight) {
      capacityText += '<div class="alert alert-danger">Težina paketa premašuje maksimalnu nosivost kombija (1500 kg).</div>';
    } else {
      capacityText += `<div class="alert alert-success">U kombi može stati ${capacity.maxPackages} paketa s ovom težinom.</div>`;
    }

    const distance = 18.999;
    const price = distance * 0.433;
    totalPrice += price;

    orderSummary.innerHTML += `
      <h4>Paket ${index + 1}</h4>
      <p><strong>Datum:</strong> ${pkg.date}</p>
      <p><strong>Klijent:</strong> ${document.getElementById(`client_${pkg.index}`).options[document.getElementById(`client_${pkg.index}`).selectedIndex]?.text || `${document.getElementById(`newClientName_${pkg.index}`).value} (${document.getElementById(`newClientAddress_${pkg.index}`).value})`}</p>
      <p><strong>Skladište:</strong> ${pkg.warehouse_address}</p>
      <p><strong>Odredišna adresa:</strong> ${pkg.destination}</p>
      <p><strong>Težina:</strong> ${pkg.weight} kg</p>
      <p><strong>Dimenzije:</strong> ${pkg.dimensions}</p>
      <p><strong>Udaljenost:</strong> ${distance} km</p>
      <p><strong>Cijena:</strong> ${price.toFixed(2)} EUR</p>
      ${capacityText}
      <hr>
    `;
  });

  document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);
  summary.style.display = packages.length > 0 ? 'block' : 'none';
  document.getElementById('invoice').style.display = 'none';
}

document.getElementById('submitTransportRequest').addEventListener('click', () => {
  if (packages.length === 0) {
    alert('Nema unesenih paketa za podnošenje zahtjeva.');
    return;
  }

  const orderData = {
    packages: packages.map(pkg => ({
      client_id: pkg.client_id,
      date: pkg.date,
      warehouse_address: pkg.warehouse_address,
      destination: pkg.destination,
      weight: pkg.weight,
      dimensions: pkg.dimensions,
    })),
  };

  fetch('http://localhost:5001/api/orders/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(orderData),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        currentOrderId = data.id;
        const invoice = document.getElementById('invoice');
        document.getElementById('invoiceIssuer').textContent = data.invoice.issuer;
        document.getElementById('invoiceRecipient').textContent = data.invoice.recipient;
        document.getElementById('invoiceId').textContent = data.invoice.reference;
        document.getElementById('invoiceIssuanceDate').textContent = data.invoice.issuanceDate;
        document.getElementById('invoiceDueDate').textContent = data.invoice.dueDate;
        document.getElementById('invoiceDescription').textContent = data.invoice.description;
        document.getElementById('invoiceQuantity').textContent = data.invoice.quantity;
        document.getElementById('invoiceUnitPrice').textContent = data.invoice.unitPrice;
        document.getElementById('invoiceVatRate').textContent = data.invoice.vatRate;
        document.getElementById('invoiceVatAmount').textContent = data.invoice.vatAmount;
        document.getElementById('invoiceTotal').textContent = data.invoice.amount;
        document.getElementById('invoiceMethod').textContent = data.invoice.method;
        document.getElementById('invoiceAccount').textContent = data.invoice.account;
        document.getElementById('invoiceRecipientPayment').textContent = data.invoice.recipient;
        document.getElementById('invoiceReference').textContent = data.invoice.reference;
        invoice.style.display = 'block';
        packages = [];
        document.getElementById('packagesContainer').innerHTML = '';
        addNextPackage();
        alert('Zahtjev za transport podnesen!');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Došlo je do greške prilikom podnošenja zahtjeva za transport.');
    });
});

function loadPendingOrders() {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  fetch('http://localhost:5001/api/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Unexpected data format');
      const pendingOrdersList = document.getElementById('pendingOrdersList');
      if (!pendingOrdersList) {
        console.error('pendingOrdersList not found');
        return;
      }
      pendingOrdersList.innerHTML = '<h3>Trenutne narudžbe</h3>';
      const pendingOrders = data.filter(order => order.status === 'pending');
      if (pendingOrders.length === 0) {
        pendingOrdersList.innerHTML += '<p>Nema trenutnih narudžbi.</p>';
        return;
      }
      const ul = document.createElement('ul');
      pendingOrders.forEach(order => {
        const li = document.createElement('li');
        const capacity = order.capacity_info;
        let capacityText = '<h5>Kapacitet kombija:</h5>';
        if (!capacity.fitsDimensions) {
          capacityText += '<div class="alert alert-danger">Dimenzije paketa premašuju ograničenja kombija (400x180x190 cm).</div>';
        } else if (capacity.exceedsWeight) {
          capacityText += '<div class="alert alert-danger">Težina paketa premašuje maksimalnu nosivost kombija (1500 kg).</div>';
        } else if (capacity.exceedsVolume) {
          capacityText += '<div class="alert alert-danger">Volumen paketa premašuje maksimalni volumen kombija.</div>';
        } else {
          capacityText += `<div class="alert alert-success">U kombi može stati ${capacity.maxPackages} paketa s ovim dimenzijama i težinom.</div>`;
        }
        li.innerHTML = `
          Klijent: ${order.client_name} (${order.client_address})<br>
          Datum: ${order.date}<br>
          Skladište: ${order.warehouse_address}<br>
          Odredište: ${order.destination}<br>
          Težina: ${order.weight} kg<br>
          Dimenzije: ${order.dimensions}<br>
          Udaljenost: ${order.distance} km<br>
          Cijena: ${order.price.toFixed(2)} EUR<br>
          Unikatni ID: ${order.unique_id}<br>
          ${capacityText}
          <button class="btn btn-sm btn-primary ms-2" onclick="submitTransportRequest(${order.id})">Podnesi zahtjev za transport</button>
        `;
        ul.appendChild(li);
      });
      pendingOrdersList.appendChild(ul);
    })
    .catch(error => console.error('Error fetching orders:', error));
}

window.submitTransportRequest = (orderId) => {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  fetch(`http://localhost:5001/api/orders/${orderId}/submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        alert('Zahtjev za transport podnesen!');
        loadPendingOrders();
        loadHistory(data.invoice.status);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Došlo je do greške prilikom podnošenja zahtjeva za transport.');
    });
};

function loadHistory(status) {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  fetch('http://localhost:5001/api/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Unexpected data format');
      let historyList;
      if (status === 'completed') historyList = document.getElementById('historyDoneList');
      else if (status === 'canceled') historyList = document.getElementById('historyCanceledList');
      else historyList = document.getElementById('historyInProgressList');
      if (!historyList) {
        console.error(`history${status}List not found`);
        return;
      }
      historyList.innerHTML = `<h3>Povijest - ${status === 'completed' ? 'Odradeno' : status === 'canceled' ? 'Otkazano' : 'U tijeku'}</h3>`;
      const filteredOrders = data.filter(order => order.status === (status || 'submitted'));
      if (filteredOrders.length === 0) {
        historyList.innerHTML += `<p>Nema narudžbi u kategoriji ${status || 'submitted'}.</p>`;
        return;
      }
      const ul = document.createElement('ul');
      filteredOrders.forEach(order => {
        const li = document.createElement('li');
        const capacity = order.capacity_info;
        let capacityText = '<h5>Kapacitet kombija:</h5>';
        if (!capacity.fitsDimensions) {
          capacityText += '<div class="alert alert-danger">Dimenzije paketa premašuju ograničenja kombija (400x180x190 cm).</div>';
        } else if (capacity.exceedsWeight) {
          capacityText += '<div class="alert alert-danger">Težina paketa premašuje maksimalnu nosivost kombija (1500 kg).</div>';
        } else if (capacity.exceedsVolume) {
          capacityText += '<div class="alert alert-danger">Volumen paketa premašuje maksimalni volumen kombija.</div>';
        } else {
          capacityText += `<div class="alert alert-success">U kombi može stati ${capacity.maxPackages} paketa s ovim dimenzijama i težinom.</div>`;
        }
        li.innerHTML = `
          Klijent: ${order.client_name} (${order.client_address})<br>
          Datum: ${order.date}<br>
          Skladište: ${order.warehouse_address}<br>
          Odredište: ${order.destination}<br>
          Težina: ${order.weight} kg<br>
          Dimenzije: ${order.dimensions}<br>
          Udaljenost: ${order.distance} km<br>
          Cijena: ${order.price.toFixed(2)} EUR<br>
          Unikatni ID: ${order.unique_id}<br>
          ${capacityText}
          Status: ${order.status}
        `;
        ul.appendChild(li);
      });
      historyList.appendChild(ul);
    })
    .catch(error => console.error('Error fetching history:', error));
}

function loadClientList() {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  fetch('http://localhost:5001/api/clients', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Unexpected data format');
      const clientList = document.getElementById('clientList');
      if (!clientList) {
        console.error('clientList not found');
        return;
      }
      clientList.innerHTML = '<h3>Popis klijenata</h3>';
      if (data.length === 0) {
        clientList.innerHTML += '<p>Nema klijenata.</p>';
        return;
      }
      const ul = document.createElement('ul');
      data.forEach(client => {
        const li = document.createElement('li');
        li.innerHTML = `
          ${client.name} (${client.address})
          <button class="btn btn-sm btn-warning ms-2" onclick="editClient(${client.id}, '${client.name}', '${client.address}')">Uredi</button>
          <button class="btn btn-sm btn-danger ms-2" onclick="deleteClient(${client.id})">Obriši</button>
        `;
        ul.appendChild(li);
      });
      clientList.appendChild(ul);
    })
    .catch(error => console.error('Error fetching clients:', error));
}

window.editClient = (id, name, address) => {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  const newName = prompt('Novo ime klijenta:', name);
  const newAddress = prompt('Nova adresa klijenta:', address);
  if (newName && newAddress) {
    fetch(`http://localhost:5001/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newName, address: newAddress }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) alert(data.error);
        else {
          alert('Klijent ažuriran!');
          loadClientList();
          loadClientsForSelect(1);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Došlo je do greške prilikom ažuriranja klijenta.');
      });
  }
};

window.deleteClient = (id) => {
  if (!token) {
    console.error('No token available. Please log in.');
    alert('Niste prijavljeni. Molimo prijavite se da biste nastavili.');
    showSection('login');
    return;
  }
  if (confirm('Jeste li sigurni da želite obrisati ovog klijenta?')) {
    fetch(`http://localhost:5001/api/clients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) alert(data.error);
        else {
          alert('Klijent obrisan!');
          loadClientList();
          loadClientsForSelect(1);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Došlo je do greške prilikom brisanja klijenta.');
      });
  }
};

document.getElementById('clientForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('clientName').value;
  const address = document.getElementById('clientAddress').value;

  fetch('http://localhost:5001/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name, address }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        alert('Klijent dodan!');
        document.getElementById('clientForm').reset();
        loadClientList();
        loadClientsForSelect(1);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Došlo je do greške prilikom dodavanja klijenta.');
    });
});

// Inicijalizacija
if (token && currentUser && packageCount === 0) {
  addNextPackage();
}
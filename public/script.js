document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var selectedDate = null;
  
    if (typeof FullCalendar === 'undefined') {
      console.error('FullCalendar nije učitan. Provjerite datoteke u public/lib folderu.');
      return;
    }
  
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      select: function(info) {
        selectedDate = info.startStr;
        alert('Odabrali ste datum: ' + selectedDate);
      }
    });
    calendar.render();
  
    function initAutocomplete() {
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.error('Google Maps API nije učitan ili Places API nije dostupan.');
        return;
      }
  
      var inputs = document.getElementsByClassName('address-input');
      for (var i = 0; i < inputs.length; i++) {
        var autocomplete = new google.maps.places.Autocomplete(inputs[i], {
          types: ['address'],
          componentRestrictions: { country: 'hr' }
        });
        autocomplete.input = inputs[i];
        autocomplete.addListener('place_changed', function() {
          var place = this.getPlace();
          if (!place.geometry) {
            console.log('Nema detalja o lokaciji za:', place.name);
            return;
          }
          this.input.value = place.formatted_address;
        });
      }
    }
  
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      initAutocomplete();
    } else {
      window.addEventListener('load', function() {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          initAutocomplete();
        } else {
          console.error('Google Maps API nije uspio učitati Places API.');
        }
      });
    }
  
    // Dinamičko dodavanje adresa
    document.getElementById('addAddress').addEventListener('click', function() {
      var addressFields = document.getElementById('addressFields');
      var addressCount = addressFields.getElementsByClassName('address-field').length;
      var newAddressField = document.createElement('div');
      newAddressField.className = 'address-field';
      newAddressField.innerHTML = `
        <label>Odredišna adresa ${addressCount}:</label><br>
        <input type="text" class="address-input" placeholder="npr. Ulica ${addressCount + 1}, Rijeka" required>
      `;
      addressFields.appendChild(newAddressField);
      initAutocomplete();
    });
  
    // Obrada forme
    var form = document.getElementById('deliveryForm');
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
  
      var warehouse = document.getElementById('warehouse').value;
      var addressInputs = document.getElementsByClassName('address-input');
      var addresses = [warehouse];
      for (var i = 1; i < addressInputs.length; i++) {
        if (addressInputs[i].value.trim()) {
          addresses.push(addressInputs[i].value);
        }
      }
  
      if (addresses.length < 2) {
        document.getElementById('result').innerHTML = 'Unesite minimalno 2 adrese.';
        return;
      }
  
      if (!selectedDate) {
        document.getElementById('result').innerHTML = 'Molimo odaberite datum prije potvrde narudžbe.';
        return;
      }
  
      try {
        const response = await fetch('http://localhost:5001/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: 'user123', date: selectedDate, addresses })
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        const optimizedRoute = data.optimizedAddresses ? data.optimizedAddresses.join(' -> ') : 'Nije dostupna optimizirana ruta';
        document.getElementById('result').innerHTML = `Narudžba:<br>Datum: ${selectedDate}<br>Optimizirana ruta: ${optimizedRoute}<br>Ukupna udaljenost: ${data.totalDistance.toFixed(2)} km<br>Cijena dostave: ${data.totalPrice.toFixed(2)} EUR`;
      } catch (error) {
        document.getElementById('result').innerHTML = 'Greška: ' + error.message;
        console.error('Error:', error);
      }
    });
  });
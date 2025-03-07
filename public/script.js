document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var selectedDate = null; // Varijabla za spremanje odabranog datuma
  
    // Inicijalizacija FullCalendara
    if (typeof FullCalendar === 'undefined') {
      console.error('FullCalendar nije učitan. Provjerite datoteke u public/lib folderu.');
      return;
    }
  
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      select: function(info) {
        selectedDate = info.startStr; // Spremi odabrani datum
        alert('Odabrali ste datum: ' + selectedDate);
      }
    });
    calendar.render();
  
    // Inicijalizacija Google Places Autocomplete
    function initAutocomplete() {
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.error('Google Maps API nije učitan ili Places API nije dostupan.');
        return;
      }
  
      var inputs = document.getElementsByClassName('address-input');
      for (var i = 0; i < inputs.length; i++) {
        var autocomplete = new google.maps.places.Autocomplete(inputs[i], {
          types: ['address'], // Ograniči na adrese
          componentRestrictions: { country: 'hr' } // Ograniči na Hrvatsku (opcionalno)
        });
        // Spremi referencu na input za kasniju upotrebu
        autocomplete.input = inputs[i];
        autocomplete.addListener('place_changed', function() {
          var place = this.getPlace();
          if (!place.geometry) {
            console.log('Nema detalja o lokaciji za:', place.name);
            return;
          }
          // Ažuriraj input s formatiranom adresom
          this.input.value = place.formatted_address;
        });
      }
    }
  
    // Provjeri je li Google Maps API učitan prije pokretanja autocomplete-a
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
  
    // Obrada forme
    var form = document.getElementById('deliveryForm');
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
  
      var warehouse = document.getElementById('warehouse').value;
      var address1 = document.getElementById('address1').value;
      var address2 = document.getElementById('address2').value;
      var addresses = [warehouse, address1, address2].filter(Boolean);
  
      // Validacija adresa
      if (addresses.some(addr => addr.trim().length < 5 || !addr.includes(','))) {
        document.getElementById('result').innerHTML = 'Unesite valjane adrese (minimum 5 znakova i mora sadržavati grad, npr. Ulica 1, Zagreb, Hrvatska).';
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
        document.getElementById('result').innerHTML = `Narudžba:<br>Datum: ${selectedDate}<br>Ukupna udaljenost: ${data.totalDistance.toFixed(2)} km<br>Cijena dostave: ${data.totalPrice.toFixed(2)} EUR`;
      } catch (error) {
        document.getElementById('result').innerHTML = 'Greška: ' + error.message;
        console.error('Error:', error);
      }
    });
  });
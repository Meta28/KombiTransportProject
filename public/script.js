document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var selectedDate = null; // Varijabla za spremanje odabranog datuma
  
    // Inicijalizacija FullCalendara
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      selectable: true,
      select: function(info) {
        selectedDate = info.startStr; // Spremi odabrani datum
        alert('Odabrali ste datum: ' + selectedDate);
      }
    });
    calendar.render();
  
    // Obrada forme
    var form = document.getElementById('deliveryForm');
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
  
      var warehouse = document.getElementById('warehouse').value;
      var address1 = document.getElementById('address1').value;
      var address2 = document.getElementById('address2').value;
      var addresses = [warehouse, address1, address2].filter(Boolean);
  
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
// Uvoz FullCalendar biblioteke
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// Prikaz kalendara
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    select: function(info) {
      alert('Odabrali ste datum: ' + info.startStr);
    }
  });
  calendar.render();
});

// Dodavanje više adresa
const addresses = document.getElementById("addresses");
document.getElementById("add-address").addEventListener("click", () => {
  const addressField = document.createElement("div");
  addressField.classList.add("address-field");
  addressField.innerHTML = `<input type="text" placeholder="Adresa dostave" class="address-input" />`;
  addresses.appendChild(addressField);
});

// Kalkulacija rute s API pozivom
document.getElementById("calculate-route").addEventListener("click", async () => {
  const allAddresses = [...document.querySelectorAll(".address-input")]
    .map(input => input.value)
    .filter(addr => addr.trim() !== "");

  if (allAddresses.length < 2) {
    document.getElementById("route-result").textContent = "Unesite najmanje dvije adrese.";
    return;
  }

  try {
    const response = await fetch('http://localhost:5001/api/route', {  // Promijenjeno: Dodan cijeli URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origins: [allAddresses[0]],
        destinations: allAddresses.slice(1)
      })
    });

    const data = await response.json();

    if (data.error) {
      document.getElementById("route-result").textContent = "Greška: " + data.error;
    } else {
      const totalDistance = data.routes[0].distanceMeters / 1000;
      const totalPrice = totalDistance * 0.5;
      document.getElementById("route-result").innerHTML = `
        <h3>Rezultat</h3>
        <p>Ukupna udaljenost: ${totalDistance.toFixed(2)} km</p>
        <p>Cijena dostave: ${totalPrice.toFixed(2)} EUR</p>
      `;
    }
  } catch (error) {
    document.getElementById("route-result").textContent = "Greška prilikom izračuna rute.";
    console.error("Greška:", error);
  }
});

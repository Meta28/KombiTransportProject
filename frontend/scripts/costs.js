import { showNotification } from './utils.js';

// Funkcija za pregled troškova
export function setupCosts() {
    document.getElementById('viewCosts').addEventListener('click', function() {
        const totalWeight = Array.from(document.getElementById('deliveryDetails').getElementsByTagName('input'))
            .filter(input => input.placeholder === 'Unesite kilazu')
            .reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
        const baseCost = 10 * totalWeight; // Cijena po kg
        const urgentSurcharge = document.getElementById('urgentDelivery').checked ? 20 : 0;
        const totalCost = baseCost + urgentSurcharge;
        document.getElementById('result').innerText = `Ukupni troškovi: ${totalCost} EUR`;
    });
}
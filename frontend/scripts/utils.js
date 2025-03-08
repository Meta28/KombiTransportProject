// Funkcije za validaciju i pomoćne metode
export function validateOrderForm(customerName, warehouse, deliveryDate, addresses) {
    if (!customerName.trim()) {
        return "Molimo unesite ime kupca.";
    }
    if (!warehouse.trim()) {
        return "Molimo unesite adresu skladišta.";
    }
    if (!deliveryDate) {
        return "Molimo odaberite datum dostave na kalendaru.";
    }
    if (addresses.length === 0) {
        return "Molimo unesite barem jednu adresu dostave.";
    }
    for (let i = 0; i < addresses.length; i++) {
        if (!addresses[i].address.trim()) {
            return `Molimo unesite adresu dostave ${i + 1}.`;
        }
    }
    return null; // Ako je sve ispravno, vraća null
}

// Funkcija za prikaz obavijesti
export function showNotification(message) {
    alert(message);
}
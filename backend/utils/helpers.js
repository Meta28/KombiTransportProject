export function validateAddresses(addresses) {
    return Array.isArray(addresses) && addresses.length >= 2;
}
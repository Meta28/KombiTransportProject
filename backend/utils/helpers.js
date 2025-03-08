cat << 'EOF' > backend/utils/helpers.js
export function validateAddresses(addresses) {
    return Array.isArray(addresses) && addresses.length >= 2;
}
EOF
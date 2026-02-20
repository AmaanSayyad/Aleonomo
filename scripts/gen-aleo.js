
const crypto = require('crypto');

function generatePlaceholder(prefix, length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const address = generatePlaceholder('aleo1', 58);
const privateKey = generatePlaceholder('APrivateKey1', 58);
const viewKey = generatePlaceholder('AViewKey1', 52);

console.log('--- Aleo Wallet Generated (Placeholders) ---');
console.log('Address:', address);
console.log('Private Key:', privateKey);
console.log('View Key:', viewKey);
console.log('\nIMPORTANT: These are placeholders. For a real wallet, use Leo Wallet or aleo-cli.');

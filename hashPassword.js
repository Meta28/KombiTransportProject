import bcrypt from 'bcrypt';

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Greška pri hashiranju lozinke:', err);
        return;
    }
    console.log('Hashirana lozinka:', hash);
});
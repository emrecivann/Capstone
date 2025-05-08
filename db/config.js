const { Pool } = require('pg');

const pool = new Pool({
    user: 'emrecivan',  // Using your system username
    host: 'localhost',
    database: 'metro_system',
    password: '',  // No password needed for local development
    port: 5432,
});

module.exports = pool; 
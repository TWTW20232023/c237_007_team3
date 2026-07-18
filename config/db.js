const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'c237-asyraf-mysql.mysql.database.azure.com',
    user: 'c237_007',
    password: 'c237_007@2026!',
    database: 'c237_007_team3',
    // Disable SSL certificate verification
    ssl: {rejectUnauthorized: false} 
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

module.exports = { connection: db };

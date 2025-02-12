const mysql = require('mysql2/promise');


const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test',
    port: 3306
});

module.exports = db; 
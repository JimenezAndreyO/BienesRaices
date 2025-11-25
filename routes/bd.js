const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'bienesraices',
  connectionLimit: 10
});

// Solo para probar conexión inicial
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error al conectar a MySQL:", err);
  } else {
    console.log("✅ Conexión a MySQL establecida");
    connection.release();
  }
});

module.exports = pool;

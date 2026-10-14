const mysql = require('mysql2/promise');

const isCloud = process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud');
const useSsl = process.env.DB_SSL === 'true' || isCloud;

const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'defaultdb',
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10
    };

const pool = mysql.createPool(poolConfig);

// Auto-create required tables on first connect
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(400),
        role ENUM('admin', 'user', 'owner') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        address VARCHAR(400),
        owner_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_store (user_id, store_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    console.log('Database connected and tables verified');

    const bcrypt = require('bcryptjs');
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (admins.length === 0) {
      const hash = await bcrypt.hash('Admin@12345678', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)",
        ['System Administrator Account', 'admin@example.com', hash, 'Headquarters Main Street Suite 100', 'admin']
      );
    }

    let [owners] = await pool.query("SELECT id FROM users WHERE email = 'owner@example.com'");
    let ownerId;
    if (owners.length === 0) {
      const ownerHash = await bcrypt.hash('Owner@12345678', 10);
      const [res] = await pool.query(
        "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)",
        ['David Miller Store Owner', 'owner@example.com', ownerHash, '124 Market Avenue Downtown', 'owner']
      );
      ownerId = res.insertId;
    } else {
      ownerId = owners[0].id;
    }

    let [customers] = await pool.query("SELECT id FROM users WHERE email = 'alice@example.com'");
    let customerId;
    if (customers.length === 0) {
      const userHash = await bcrypt.hash('User@12345678', 10);
      const [res] = await pool.query(
        "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)",
        ['Alice Robinson Customer', 'alice@example.com', userHash, '45 Green Valley Road Apt 2B', 'user']
      );
      customerId = res.insertId;
    } else {
      customerId = customers[0].id;
    }

    const [stores] = await pool.query("SELECT id FROM stores LIMIT 1");
    if (stores.length === 0) {
      const [s1] = await pool.query(
        "INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)",
        ['Green Grocery Supermarket', 'contact@greengrocery.com', '124 Market Avenue Downtown', ownerId]
      );
      const [s2] = await pool.query(
        "INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)",
        ['Urban Style Clothing Boutique', 'info@urbanstyleboutique.com', '500 Fashion Avenue Block C', null]
      );
      await pool.query(
        "INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)",
        ['TechZone Electronics Outlet', 'support@techzoneoutlet.com', '77 Digital Boulevard Sector 4', null]
      );

      if (customerId) {
        await pool.query(
          "INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?), (?, ?, ?)",
          [customerId, s1.insertId, 5, customerId, s2.insertId, 4]
        );
      }
    }
  } catch (err) {
    console.error('Database connection / init notice:', err.message);
  }
}

initDb();

module.exports = pool;

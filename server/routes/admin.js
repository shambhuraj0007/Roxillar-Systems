const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { validateUser } = require('../middleware/validate');

router.use(auth, requireRole('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role != 'admin'");
    const [[{ totalStores }]] = await db.query('SELECT COUNT(*) AS totalStores FROM stores');
    const [[{ totalRatings }]] = await db.query('SELECT COUNT(*) AS totalRatings FROM ratings');
    res.json({ totalUsers, totalStores, totalRatings });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  const { name, email, address, role } = req.query;
  const sortBy = ['name', 'email', 'address', 'role'].includes(req.query.sortBy) ? req.query.sortBy : 'name';
  const order = req.query.order === 'desc' ? 'DESC' : 'ASC';

  let query = `
    SELECT u.id, u.name, u.email, u.address, u.role,
      ROUND(AVG(r.rating), 1) AS avgRating
    FROM users u
    LEFT JOIN stores s ON s.owner_id = u.id
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (name) { query += ' AND u.name LIKE ?'; params.push(`%${name}%`); }
  if (email) { query += ' AND u.email LIKE ?'; params.push(`%${email}%`); }
  if (address) { query += ' AND u.address LIKE ?'; params.push(`%${address}%`); }
  if (role) { query += ' AND u.role = ?'; params.push(role); }

  query += ` GROUP BY u.id ORDER BY ${sortBy} ${order}`;

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/owners', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email FROM users WHERE role = 'owner' ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.address, u.role,
        ROUND(AVG(r.rating), 1) AS avgRating
       FROM users u
       LEFT JOIN stores s ON s.owner_id = u.id
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', async (req, res) => {
  const { name, email, password, address, role } = req.body;
  const errors = validateUser({ name, email, password, address }, true);
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });
  if (!['admin', 'user', 'owner'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, address, role]
    );
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stores', async (req, res) => {
  const { name, email, address } = req.query;
  const sortBy = ['name', 'email', 'address', 'avgRating'].includes(req.query.sortBy) ? req.query.sortBy : 'name';
  const order = req.query.order === 'desc' ? 'DESC' : 'ASC';

  let query = `SELECT s.id, s.name, s.email, s.address,
    ROUND(AVG(r.rating), 1) AS avgRating
    FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
    WHERE 1=1`;
  const params = [];

  if (name) { query += ' AND s.name LIKE ?'; params.push(`%${name}%`); }
  if (email) { query += ' AND s.email LIKE ?'; params.push(`%${email}%`); }
  if (address) { query += ' AND s.address LIKE ?'; params.push(`%${address}%`); }

  query += ` GROUP BY s.id ORDER BY ${sortBy} ${order}`;

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/stores', async (req, res) => {
  const { name, email, address, owner_id } = req.body;
  if (!name || name.length < 20 || name.length > 60) {
    return res.status(400).json({ message: 'Store name must be 20-60 characters' });
  }

  try {
    await db.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name, email, address, owner_id || null]
    );
    res.status(201).json({ message: 'Store created' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

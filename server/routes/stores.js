const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('user'));

router.get('/', async (req, res) => {
  const { name, address } = req.query;
  const sortBy = ['name', 'address', 'avgRating'].includes(req.query.sortBy) ? req.query.sortBy : 'name';
  const order = req.query.order === 'desc' ? 'DESC' : 'ASC';

  let query = `
    SELECT s.id, s.name, s.address,
      ROUND(AVG(r.rating), 1) AS avgRating,
      (SELECT rating FROM ratings WHERE user_id = ? AND store_id = s.id) AS myRating
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE 1=1
  `;
  const params = [req.user.id];

  if (name) { query += ' AND s.name LIKE ?'; params.push(`%${name}%`); }
  if (address) { query += ' AND s.address LIKE ?'; params.push(`%${address}%`); }

  query += ` GROUP BY s.id ORDER BY ${sortBy} ${order}`;

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:storeId/rate', async (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    await db.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [req.user.id, req.params.storeId, rating]
    );
    res.json({ message: 'Rating saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

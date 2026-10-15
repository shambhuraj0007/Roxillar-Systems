const router = require('express').Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth, requireRole('owner'));

router.get('/dashboard', async (req, res) => {
  try {
    const [stores] = await db.query('SELECT id FROM stores WHERE owner_id = ?', [req.user.id]);
    if (stores.length === 0) return res.json({ avgRating: null, raters: [] });

    const storeId = stores[0].id;

    const [[{ avgRating }]] = await db.query(
      'SELECT ROUND(AVG(rating), 1) AS avgRating FROM ratings WHERE store_id = ?',
      [storeId]
    );

    const [raters] = await db.query(
      `SELECT u.name, u.email, r.rating, r.created_at
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = ?
       ORDER BY r.created_at DESC`,
      [storeId]
    );

    res.json({ avgRating, raters });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

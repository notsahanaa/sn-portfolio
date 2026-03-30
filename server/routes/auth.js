import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;

  console.log('Login attempt:');
  console.log('  Received password length:', password?.length);
  console.log('  Expected password length:', process.env.ADMIN_PASSWORD?.length);
  console.log('  ADMIN_PASSWORD loaded:', !!process.env.ADMIN_PASSWORD);

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    console.log('  Password mismatch!');
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

export default router;

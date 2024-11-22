import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Register user
router.post('/register', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, phone }]);
    
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
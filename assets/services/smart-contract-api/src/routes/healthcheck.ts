import express from 'express';

const router = express.Router();

const STAYING_ALIVE = `
  Whether you're a brother or whether you're a mother
  You're stayin' alive, stayin' alive
  Feel the city breakin' and everybody shakin'
  And we're stayin' alive, stayin' alive
  Ah, ha, ha, ha, stayin' alive, stayin' alive
  Ah, ha, ha, ha, stayin' alive
`;

/* Deploy contract. */
router.get('/', function (req, res) {
  res.json({ message: STAYING_ALIVE });
});

export default router;

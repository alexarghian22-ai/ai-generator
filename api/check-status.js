// api/check-status.js
// Verifică pe server statusul unei randări Shotstack, ca să nu expunem
// cheia API în browser la fiecare polling.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodă neacceptată. Folosește GET.' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lipsește ID-ul randării.' });
  }

  const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
  const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV || 'stage';

  if (!SHOTSTACK_API_KEY) {
    return res.status(500).json({ error: 'Cheia Shotstack nu este configurată pe server.' });
  }

  try {
    const endpoint = `https://api.shotstack.io/edit/${SHOTSTACK_ENV}/render/${id}`;

    const response = await fetch(endpoint, {
      headers: { 'x-api-key': SHOTSTACK_API_KEY },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: 'Eroare la verificarea statusului.' });
    }

    return res.status(200).json({
      status: data.response.status,
      url: data.response.url || null,
    });
  } catch (err) {
    console.error('Eroare server check-status:', err);
    return res.status(500).json({ error: 'Eroare internă la verificarea statusului.' });
  }
}

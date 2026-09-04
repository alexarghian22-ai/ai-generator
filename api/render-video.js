// api/render-video.js
// Primește lista de scene (generate în pasul anterior) și construiește
// timeline-ul Shotstack, apoi pornește randarea.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodă neacceptată. Folosește POST.' });
  }

  const { scenes } = req.body || {};

  if (!Array.isArray(scenes) || scenes.length === 0) {
    return res.status(400).json({ error: 'Lipsesc scenele video-ului.' });
  }

  const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;
  const SHOTSTACK_ENV = process.env.SHOTSTACK_ENV || 'stage'; // 'stage' (gratuit, watermark) sau 'v1' (producție)

  if (!SHOTSTACK_API_KEY) {
    return res.status(500).json({ error: 'Cheia Shotstack nu este configurată pe server.' });
  }

  try {
    // Construim clipurile de text, unul după altul, calculând momentul de start
    let currentTime = 0;
    const titleClips = [];
    const backgroundClips = [];

    for (const scene of scenes) {
      const duration = Math.min(Math.max(Number(scene.duration) || 3, 2), 5);
      const bgColor = scene.bgColor || '#1e1b4b';
      const textColor = scene.textColor || '#ffffff';
      const effect = ['zoomIn', 'zoomOut', 'slideLeft', 'slideRight', 'fade'].includes(scene.effect)
        ? scene.effect
        : 'fade';

      titleClips.push({
        asset: {
          type: 'title',
          text: String(scene.text || '').slice(0, 200),
          style: 'minimal',
          size: 'medium',
          color: textColor,
        },
        start: currentTime,
        length: duration,
        effect,
      });

      backgroundClips.push({
        asset: {
          type: 'html',
          html: `<div style="background-color:${bgColor}; width:100%; height:100%;"></div>`,
          width: 1080,
          height: 1920,
        },
        start: currentTime,
        length: duration,
      });

      currentTime += duration;
    }

    const shotstackPayload = {
      timeline: {
        tracks: [{ clips: titleClips }, { clips: backgroundClips }],
      },
      output: {
        format: 'mp4',
        resolution: 'sd',
        size: { width: 1080, height: 1920 },
      },
    };

    const endpoint = `https://api.shotstack.io/edit/${SHOTSTACK_ENV}/render`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': SHOTSTACK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shotstackPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Eroare Shotstack:', data);
      return res.status(502).json({ error: data.message || 'Eroare la pornirea randării video.' });
    }

    return res.status(200).json({ renderId: data.response.id });
  } catch (err) {
    console.error('Eroare server render-video:', err);
    return res.status(500).json({ error: 'Eroare internă la pornirea randării.' });
  }
}

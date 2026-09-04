// api/generate-script.js
// Primește ideea utilizatorului și cere lui Claude să o transforme
// într-un scenariu structurat, cu mai multe scene, gata de trimis la Shotstack.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodă neacceptată. Folosește POST.' });
  }

  const { idea } = req.body || {};

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'Lipsește textul ideii.' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Cheia Claude API nu este configurată pe server.' });
  }

  // Paleta de culori de fundal din care Claude poate alege, ca să păstrăm
  // un aspect coerent și "video-friendly" (nu culori random).
  const systemPrompt = `Ești un regizor creativ care transformă o idee scurtă într-un scenariu
pentru un video vertical scurt (stil reel/short), format din 3 până la 6 scene.

Răspunde STRICT cu un obiect JSON valid, fără text explicativ, fără markdown,
fără backticks. Structura exactă trebuie să fie:

{
  "scenes": [
    {
      "text": "textul afișat pe ecran, scurt, max 12 cuvinte",
      "duration": 3,
      "bgColor": "#culoare-hex",
      "textColor": "#culoare-hex",
      "effect": "zoomIn"
    }
  ]
}

Reguli:
- "duration" e în secunde, între 2 și 5.
- "effect" trebuie să fie unul dintre: "zoomIn", "zoomOut", "slideLeft", "slideRight", "fade".
- Alege culori de fundal închise, contrastante, coerente tematic cu ideea (ex: nuanțe de albastru închis, mov, verde închis, negru).
- "textColor" trebuie să contrasteze puternic cu "bgColor" (de obicei alb sau un accent deschis).
- Textul fiecărei scene trebuie să continue o narațiune coerentă: introducere → dezvoltare → concluzie/call-to-action.
- Scrie textele în aceeași limbă în care utilizatorul a scris ideea.
- Nu adăuga niciun comentariu în afara JSON-ului.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: idea.trim() }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Eroare Claude API:', data);
      return res.status(502).json({ error: 'Eroare la generarea scenariului.', details: data });
    }

    const rawText = data.content?.[0]?.text?.trim() || '';

    let parsed;
    try {
      // Curățăm eventuale backtick-uri de markdown, ca măsură de siguranță
      const cleaned = rawText.replace(/^```json\s*|```$/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Răspuns Claude neparsabil:', rawText);
      return res.status(502).json({ error: 'Scenariul generat nu a putut fi interpretat.' });
    }

    if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return res.status(502).json({ error: 'Scenariul generat este invalid.' });
    }

    return res.status(200).json({ scenes: parsed.scenes });
  } catch (err) {
    console.error('Eroare server generate-script:', err);
    return res.status(500).json({ error: 'Eroare internă la generarea scenariului.' });
  }
}

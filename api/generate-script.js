// api/generate-script.js
// Primește ideea utilizatorului și cere lui Gemini (Google) să o transforme
// într-un scenariu structurat, cu mai multe scene, gata de trimis la Shotstack.
// Foloseste nivelul gratuit al Gemini API (fara card necesar).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodă neacceptată. Folosește POST.' });
  }

  const { idea } = req.body || {};

  if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
    return res.status(400).json({ error: 'Lipsește textul ideii.' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Cheia Gemini API nu este configurată pe server.' });
  }

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
    const model = 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: idea.trim() }],
          },
        ],
        generationConfig: {
          // Cerem direct raspuns JSON, ca sa nu mai fie nevoie sa curatam markdown
          responseMimeType: 'application/json',
          temperature: 0.9,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Eroare Gemini API:', data);
      return res.status(502).json({ error: 'Eroare la generarea scenariului.', details: data });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Răspuns Gemini neparsabil:', rawText);
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


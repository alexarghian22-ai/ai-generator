# AI Video Generator

Un utilizator scrie o idee, Claude AI construiește un scenariu cu mai multe
scene, iar Shotstack randează un videoclip vertical scurt (format reel).

## Cum funcționează

1. `public/index.html` — interfața. Nu conține nicio cheie API.
2. `api/generate-script.js` — trimite ideea la Claude, primește înapoi un
   scenariu structurat (JSON cu scene, text, culori, efecte).
3. `api/render-video.js` — transformă scenariul într-un timeline Shotstack
   și pornește randarea.
4. `api/check-status.js` — verifică periodic dacă video-ul e gata.

Cheile API stau **doar** ca variabile de mediu pe server, niciodată în cod
sau în browser.

## Instalare locală

1. Instalează Vercel CLI, dacă nu-l ai deja:
   ```
   npm install -g vercel
   ```

2. Copiază `.env.example` în `.env.local` și completează cheile tale:
   ```
   cp .env.example .env.local
   ```

3. Rulează local:
   ```
   vercel dev
   ```

   Site-ul va porni de obicei pe `http://localhost:3000`.

## Deployment pe Vercel

1. Pune proiectul într-un repository GitHub.
2. Pe [vercel.com](https://vercel.com), apasă "Add New Project" și
   conectează repository-ul.
3. La pasul de configurare, adaugă variabilele de mediu (Settings →
   Environment Variables):
   - `ANTHROPIC_API_KEY`
   - `SHOTSTACK_API_KEY`
   - `SHOTSTACK_ENV` (pune `stage` pentru test, `v1` pentru producție)
4. Apasă Deploy. Vercel detectează automat folderul `api/` ca funcții
   serverless și `public/` ca site static.

## Următorii pași posibili

- Adăugarea de sunet de fundal sau voce generată AI pe scene.
- Alegerea unui format (vertical/orizontal) direct din interfață.
- Salvarea video-urilor generate într-un istoric per utilizator (necesită
  bază de date, ex. Vercel Postgres sau Supabase).
- Trecerea de la `SHOTSTACK_ENV=stage` (cu watermark, gratuit) la `v1`
  (producție, necesită plan plătit Shotstack) când ești gata de lansare.

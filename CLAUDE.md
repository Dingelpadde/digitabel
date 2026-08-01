# DigitABEL — Prosjektoversikt for Claude

## Hva er dette
AI-læringsassistent for DiP-programmet (Innholdsproduksjon og historiefortelling) ved Fagskolen Kristiania. Bygget av og for faglærer **Abel Christoffer**.

To grensesnitt:
- **Studentside** — mobil-first PWA, tilgang via `/student`
- **Faglærerdashboard** — PC, tilgang via `/admin` (ingen synlig lenke fra forsiden)

Ca. 26 studenter per kull.

---

## Tech-stack
- React + Vite (frontend)
- Supabase (PostgreSQL + realtime)
- Anthropic Claude API (`claude-sonnet-4-6`) via streaming Vercel Edge Functions
- Resend (e-post — INGEN SMS)
- Vercel (deploy)

Local dev: `vercel dev` (ikke bare `vite` — API-ruter krever Vercel-miljø).
Vite proxier `/api` → localhost:3001.

---

## Ruter
| Rute | Komponent | Beskrivelse |
|---|---|---|
| `/` | `Landing.jsx` | Forside — student-kort + planlegging-kort (ingen synlig faglærer-knapp) |
| `/student` | `AssignmentList.jsx` | Oppgaveliste for student |
| `/student/:assignmentId` | `AssignmentDetail.jsx` | Prepform → Chat |
| `/project` | `ProjectPlanPage.jsx` | Milepælplanlegging (4 slots) |
| `/admin` | `TeacherApp.jsx` | Faglærerdashboard (passord-beskyttet) |
| `/admin/student/:studentId` | `StudentDetail.jsx` | Studentdetaljer for faglærer |
| `/teacher/*` | redirect | Videresender til `/admin` |

**Viktig:** Faglærerruten er `/admin`, ikke `/teacher`. Ikke legg inn synlig lenke fra studentgrensesnittet.

---

## Design-system ("Cyber rosa")
Mørk lilla/rosa glitch-cyberpunk estetikk. **Aldri varm/gull SNES — det er gammel stil.**

**CSS-variabler** (i `src/index.css`):
- `--color-bg`: #0c060f
- `--color-surface`: #150a1a
- `--color-surface-alt`: #221229
- `--color-accent`: #e87ab0 (rosa)
- `--color-accent-dark`: #b8508a
- `--color-text`: #ecdef0
- `--color-text-muted`: #7e6090
- `--color-border`: #3a2045
- `--color-chroma-pink`: #e87ad6
- `--color-chroma-blue`: #b07ae8
- `--color-danger`: rød feil-farge

**Fonter:**
- `--font-display`: Space Grotesk (titler)
- `--font-body`: Space Mono (brødtekst/UI)
- `--font-pixel`: Press Start 2P (labels/brand)

**Klasser:**
- `.btn-primary` / `.btn-secondary`
- `.card` / `.card-featured` (featured = chroma-ramme + ✦-stjerne)
- `.bubble-in` / `.bubble-out` (chat-bobler, asymmetrisk border-radius)
- `.glitch` + `data-text="..."` (RGB-split glitch-effekt på titler)
- `.stars` / `.pstar` (pixel-stjernefelt i bakgrunn, brukt på Landing, AssignmentList, PrepForm, ProjectPlanPage)
- `.grain` (fast noise-overlay, brukes på alle sider)
- `.pixel-label` (liten Press Start 2P-etikett)
- `.dashed-line` (stiplet linje, brukes som "I DAG"-skille i chat)
- `.input` / `.textarea` (skjemafelt)

**Avatar:** `public/abel-avatar.png` (350x350 pixelart). Rendres via `CharacterSprite.jsx`.
Forside-spesifikk CSS ligger i en `<style>`-blokk i `Landing.jsx`.

---

## Viktige filer
| Fil | Beskrivelse |
|---|---|
| `src/data/personality.js` | `DIGITABEL_VOICE` — delt stemme, rolle og veiledningsregler. Rediger KUN her for tone/regler. Settes foran HVER temaoppgaves systemPrompt. |
| `src/data/assignments.js` | 3 temaoppgaver med prepspørsmål, Grad 1/2/3-systemPrompt og veiledningsdatoer. |
| `src/lib/supabase.js` | Alle Supabase-kall (upsertStudent, savePrepAnswers, saveChatMessage, saveSynopsis osv.). |
| `src/components/character/CharacterSprite.jsx` | Pixel-Abel avatar. Poses: `idle`, `talking`, `thinking`, `serious`. Brukes i chat-bobler (sm = 38px). |
| `api/chat.js` | Vercel Edge Function — streamer Claude til ChatInterface. |
| `api/plan.js` | Vercel Edge Function — genererer milepælplan som JSON. Støtter `themeContext` med veiledningsdato. |
| `api/synopsis.js` | Vercel Edge Function — genererer synopsis for faglærer etter CLEARED. |
| `api/send-reminder.js` | Vercel Edge Function — sender e-postpåminnelser via Resend. |
| `supabase/migrations/001_initial.sql` | Full schema + RLS. Kjøres i Supabase SQL Editor. |

---

## Temaoppgaver (`src/data/assignments.js`)
Tre faste oppgaver + veiledningsdatoer:

| ID | Tittel | Veiledning |
|---|---|---|
| `tema-1-bildeserie` | Bildeserie | 9. sep 2026 |
| `tema-2-film` | Film og postproduksjon | 22. okt 2026 |
| `tema-3-historiefortelling` | Historiefortelling og fordypning i klipp | Ikke satt ennå |

Ikke legg inn faste oppgavealternativer eller merkevarer i `assignments.js` — de byttes ut hvert år.
Grad 1/2/3-systemet er beskrevet per tema. Digitabel starter alltid på Grad 1 og dytter studenten ETT hakk opp.

---

## Studentflyt
```
Landing → StudentLogin
            ├─ Ny student: Samtykke (2 avkrysninger) → Registrering (navn, e-post, kull)
            └─ Returnerende: E-post login
        → AssignmentList
        → AssignmentDetail
            ├─ PrepForm (min. 2 tegn per svar)
            └─ ChatInterface
                 └─ (CLEARED) → student klikker "Tilbake til oppgavene"-knapp
                              → DONE-skjerm (kan klikke "Les samtalen" for å gå tilbake til chat)
```

**Viktig om CLEARED-flyten:** Studenten kastes IKKE automatisk ut av chatten når Claude skriver `✓ CLEARED`. De ser sluttmeldingen ferdig, og må selv klikke en knapp for å gå videre. Fra DONE-skjermen kan de klikke "Les samtalen" for å bla tilbake i chatten.

**localStorage-nøkler:**
- `digitabel_consent` — satt når bruker har samtykket (styrer om de ser consent-steget igjen)
- `digitabel_project_plans` — array av 4 slots for milepælplaner

---

## Faglærerflyt
```
Landing → /admin (direkte URL, ingen synlig lenke)
        → TeacherDashboard (oversikt / studenter / varsler)
        → /admin/student/:id → StudentDetail
```

StudentDetail viser: forberedelsessvar, samtalehistorikk, synopsis (auto-generert av Claude etter CLEARED).

---

## ChatInterface — viktig logikk
- **Auto-start:** Digitabel sender første melding automatisk når chatten åpnes.
- **Streaming:** Teksten strømmer inn token for token via Vercel Edge Function.
- **CLEARED-deteksjon:** Sjekker om `fullText.includes('✓ CLEARED')` etter at streaming er ferdig.
- **Psykisk helse-protokoll:** Nøkkelord-deteksjon i `handleSend` (selvmord, ta livet, depresjon osv.). Gir fast svar med SiO Helse (22 85 32 00 / sio.no/helse). Setter CharacterSprite-pose til `serious`.
- **Iritabel-modus:** Beskrevet i `personality.js`. Tørr/oppgitt tone for studenter som ikke har gjort noe — ikke for overveldede. Glir tilbake til vanlig Digitabel når studenten engasjerer seg.
- **Synopsis:** Genereres automatisk i bakgrunnen etter CLEARED via `/api/synopsis`. Lagres i `student_assignments.synopsis`. Vises i faglærerdashboardet.

**CharacterSprite-poser:**
- `idle` — 3s pust-animasjon (standard)
- `talking` — 0.6s stepped animasjon (mens Claude svarer)
- `thinking` — heller hodet 1.5s (mens Claude prosesserer)
- `serious` — stille (psykisk helse-protokoll)

**TODO (ikke implementert ennå):** Iritabel-avatar — egen pose med sur/oppgitt mine som byttes inn i Iritabel-modus.

---

## Prosjektplanlegging (`/project`)
4 slots lagret i `localStorage` (`digitabel_project_plans`, array av 4):
1. **Bildeserie** — veiledning 9. sep, sender temakontekst til API
2. **Film og postproduksjon** — veiledning 22. okt, sender temakontekst til API
3. **Historiefortelling** — dato ikke satt, sender temakontekst til API
4. **Valgfritt prosjekt** — ingen temakontekst

Slot-picker viser prosjektnavn når plan er lagret. Slots 1-3 sender `themeContext` til `api/plan.js` med veiledningsdato, og Claude legger inn "Klar til veiledning" som fast milepæl. Studenten kan gjøre én redigering per plan.

---

## Supabase-tabeller
- `students` — id, name, email, kull, consent_given_at
- `assignments` — id, order_index, title
- `student_assignments` — student_id, assignment_id, status, synopsis
- `prep_answers` — student_assignment_id, question_index, question_text, answer
- `chat_messages` — student_assignment_id, role, content

Status-verdier: `not_started` | `in_progress` | `cleared`

RLS: "Allow all"-policies (alle tabeller) — Supabase er ikke brukt til autentisering.

---

## Environment-variabler
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_TEACHER_PASSWORD   # standard "admin"
ANTHROPIC_API_KEY       # server-side, ingen VITE_-prefiks
RESEND_API_KEY
```

---

## Kodekonvensjoner
- **Norsk bokmål** overalt i UI og prompts
- **Ingen emojier** — verken i kode-UI eller Claude-svar
- **Ingen tankestrek** (— eller –) i UI-tekst eller Claude-svar — bruk komma/punktum
- **`100dvh`** (ikke `100vh`) på alle student-sider (mobil/iOS-fix)
- **`env(safe-area-inset-bottom)`** i composer-padding (iOS-fix)
- **`font-size: 16px`** på `.input` og `.textarea` på mobil (iOS zoom-fix)
- Inline styles (ikke Tailwind-klasser) — design-systemet styres av CSS custom properties
- Ikke legg til features, refaktorer eller "forbedringer" som ikke er eksplisitt bedt om
- `ReflectionForm` er **fjernet** fra flyten — ikke gjeninnfør den

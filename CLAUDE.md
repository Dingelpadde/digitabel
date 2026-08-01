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
- PWA (Web Push planlagt)

Local dev: `vercel dev` (ikke bare `vite` — API-ruter krever Vercel-miljø).
Vite proxier `/api` → localhost:3001.

---

## Ruter
| Rute | Komponent | Beskrivelse |
|---|---|---|
| `/` | `Landing.jsx` | Forside, velg rolle |
| `/student` | `AssignmentList.jsx` | Oppgaveliste for student |
| `/student/:assignmentId` | `AssignmentDetail.jsx` | Prepform → Chat |
| `/project` | `ProjectPlanPage.jsx` | Milepælplanlegging (4 slots) |
| `/admin` | `TeacherApp.jsx` | Faglærerdashboard |
| `/admin/student/:studentId` | `StudentDetail.jsx` | Studentdetaljer |

**Viktig:** Faglærerruten er `/admin`, ikke `/teacher`. Ikke legg inn synlig lenke til `/admin` fra studentgrensesnittet.

---

## Design-system ("Cyber rosa")
Mørk lilla/rosa glitch-cyberpunk estetikk. Aldri varm/gull SNES — det er gammel stil.

**CSS-variabler** (i `src/index.css`):
- `--color-bg`: #0c060f
- `--color-surface`: #150a1a
- `--color-accent`: #e87ab0 (rosa)
- `--color-text`: #ecdef0
- `--color-text-muted`: #7e6090
- `--color-border`: #3a2045
- `--color-chroma-pink`: #e87ad6
- `--color-chroma-blue`: #b07ae8

**Fonter:**
- `--font-display`: Space Grotesk (titler)
- `--font-body`: Space Mono (brødtekst/UI)
- `--font-pixel`: Press Start 2P (labels/brand)

**Klasser:**
- `.btn-primary` / `.btn-secondary`
- `.card` / `.card-featured` (featured = chroma-ramme + ✦-stjerne)
- `.bubble-in` / `.bubble-out` (chat-bobler)
- `.glitch` + `data-text="..."` (RGB-split glitch-effekt på titler)
- `.stars` / `.pstar` (pixel-stjernefelt i bakgrunn)
- `.grain` (fast noise-overlay)
- `.pixel-label` (liten Press Start 2P-etikett)

**Avatar:** `public/abel-avatar.png` (350x350 pixelart). Rendres via `CharacterSprite.jsx`.

---

## Viktige filer
| Fil | Beskrivelse |
|---|---|
| `src/data/personality.js` | DIGITABEL_VOICE — delt stemme, rolle og veiledningsregler. Rediger KUN her for tone/regler. |
| `src/data/assignments.js` | 3 temaoppgaver med prepspørsmål, systemPrompt og veiledningsdatoer. |
| `src/lib/supabase.js` | Alle Supabase-kall. |
| `api/chat.js` | Vercel Edge Function — streamer Claude. |
| `api/plan.js` | Vercel Edge Function — genererer milepælplan (JSON). Støtter themeContext med veiledningsdato. |
| `api/synopsis.js` | Vercel Edge Function — genererer synopsis for faglærer etter CLEARED. |
| `supabase/migrations/001_initial.sql` | Full schema + RLS. Kjøres i Supabase SQL Editor. |

---

## Temaoppgaver
Tre faste oppgaver + veiledningsdatoer for 2026:

| ID | Tittel | Veiledning |
|---|---|---|
| `tema-1-bildeserie` | Bildeserie | 9. sep 2026 |
| `tema-2-film` | Film og postproduksjon | 22. okt 2026 |
| `tema-3-historiefortelling` | Historiefortelling og fordypning i klipp | Ikke satt ennå |

Ikke legg inn faste oppgavealternativer eller merkevarer i assignments.js — de byttes ut hvert år.

---

## Studentflyt
```
Landing → StudentLogin (samtykke → registrering / returlogin)
        → AssignmentList
        → AssignmentDetail → PrepForm → ChatInterface
                                      → (CLEARED) → DONE-skjerm
                                                   → (kan lese samtalen igjen)
```

CLEARED-flyten: Claude avslutter med `✓ CLEARED` på egen linje. ChatInterface oppdager dette, viser "Tilbake til oppgavene"-knapp. Studenten klikker selv — de kastes IKKE automatisk til DONE-skjermen. Fra DONE-skjermen kan de klikke "Les samtalen" for å bla tilbake.

## Faglærerflyt
```
Landing → /admin (direkte URL, ingen synlig lenke)
        → TeacherDashboard (oversikt, studenter, varsler)
        → /admin/student/:id → StudentDetail
```

---

## Prosjektplanlegging (`/project`)
4 slots lagret i `localStorage` (`digitabel_project_plans`, array av 4):
1. Bildeserie (veiledning 9. sep)
2. Film og postproduksjon (veiledning 22. okt)
3. Historiefortelling (dato ikke satt)
4. Valgfritt prosjekt (ingen temakontekst)

Slots 1-3 sender `themeContext` til `api/plan.js` med veiledningsdato. Claude legger denne inn som fast milepæl "Klar til veiledning". Slot-picker viser prosjektnavn når plan er lagret.

---

## Supabase-tabeller
- `students` (id, name, email, kull, consent_given_at)
- `assignments` (id, order_index, title)
- `student_assignments` (student_id, assignment_id, status, synopsis)
- `prep_answers` (student_assignment_id, question_index, question_text, answer)
- `chat_messages` (student_assignment_id, role, content)

Status-verdier: `not_started` | `in_progress` | `cleared`

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
- Norsk bokmål overalt i UI og prompts
- Ingen emojier (verken i kode eller Claude-svar)
- Ingen tankestrek (— eller –) i UI-tekst eller Claude-svar — bruk komma/punktum
- `100dvh` (ikke `100vh`) på alle student-sider (mobil-fix)
- `env(safe-area-inset-bottom)` i composer-padding (iOS-fix)
- Inline styles (ikke Tailwind-klasser) — design-systemet bruker CSS custom properties
- Ikke legg til features, refaktorer eller "forbedringer" som ikke er bedt om

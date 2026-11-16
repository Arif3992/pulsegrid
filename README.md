# PulseGrid Live Dashboard

Live site: https://arif3992.github.io/pulsegrid/

## Live performance

| Check | Score |
| --- | --- |
| Performance | |
| Accessibility | |
| Best Practices | |
| SEO | |
| Largest Contentful Paint | |
| Interaction to Next Paint | |
| Cumulative Layout Shift | |

## Live Feed Pipeline

- Sources: Open-Meteo forecast API and Open-Meteo air quality API.
- Refresh interval: every ten minutes.
- Gap treatments: imputation, default values, removal, flagging.
- Failure behaviour: a failed feed shows a clear message, never a blank box; the last good reading and its time are shown.
- Files: pulsegrid/live-feed.html, pulsegrid/pipeline.js, pulsegrid/data-dictionary.md.

## Widgets

- Air quality card — WCAG AA result: [fill from the real audit; see §7]. Test note: widget-test-note.md.

## 3D Terrain

- Files: terrain-3d.js, terrain-3d.html.
- Colour scale: green means clean air under 50. Amber means moderate air from 50 to 99. Red means bad air at 100 or more.

## Accessibility report

[Filled from the REAL Lighthouse audit — see §6.1.]

## Security report

[Filled from the REAL live tests — see §6.2.]

## Stored readings

- Stored readings are encrypted with AES-GCM. Each reading is checked with SHA-256. The three roles (admin, editor, viewer) are enforced.

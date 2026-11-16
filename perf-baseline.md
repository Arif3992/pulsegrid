# PulseGrid performance baseline

## Version one change log

Version one. Each fix made during assembly, with the reason for each fix:

- Focus ring colour: used the Figma-run substitute #000000. Reason: the book prints no hex value for the focus token anywhere (4.1 Skill Drill step 8).
- Air quality card value span (#air-value) wired to the live PM2.5 reading from the pipeline, with the band word from the pickLine thresholds. Reason: the book prints no code for this wiring joint (4.3(c); brief section 3 W3).
- Summary panel update function added, including the book's mock-summary label ("Mock summary — stream offline, last reading [time]") when the stream is down. Reason: the book prints the panel rules but no update function (4.3(d); brief section 3 W5).
- Observation form: added the aqi-reading field (number, min 0, max 500), form-message, blocked-log and observation-list. Reason: the submit handler reads these four elements, but the book never prints them in the form markup (brief section 3 W10).
- Encrypted store setup and unlock-button wiring added. Reason: the book prints the store functions but no setup or button wiring (4.3(f)).
- Rain model script tag: used ml5 v0.12.2 UMD (https://unpkg.com/ml5@0.12.2/dist/ml5.min.js). Reason: the book prints no ml5 version and no CDN URL (5.5).
- 3D terrain loader: used the jsDelivr p5@1 script tag (https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js) and an iframe embed with loading="lazy". Reason: the book prints no HTML for the terrain viewer and no embed markup (5.7; brief section 3 W9).
- tokens.css: used the Figma-run substitute hex values. Reason: the book prints no hex value for any token (5.9).

## Baseline timings

Timings are measured live during the build (4.2 Solo PBL step 12). No timings have been measured yet in this run; the fields below are filled in step 8 (publish + Lighthouse run). No numbers are invented here.

- First paint time: [to be measured in step 8]
- Largest item time: [to be measured in step 8]

## Screen widths tested

- 390 px — first paint: [to be measured in step 8], largest item: [to be measured in step 8]
- 800 px — first paint: [to be measured in step 8], largest item: [to be measured in step 8]
- 1280 px — first paint: [to be measured in step 8], largest item: [to be measured in step 8]

## Version two

Version two entries (each Lighthouse fix, reason, score before and after) are added in 4.3 Bit-by-Bit step 5, after the audit run.

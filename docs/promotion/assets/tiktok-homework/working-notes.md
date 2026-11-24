# Video export working notes — 17 November 2026

- The selected concept is approved for drafting only. The final video, temporary voice, and caption remain unapproved for publication.
- The sandbox blocked macOS speech access and Chromium's Mach-port registration. The local render succeeded outside the sandbox after automatic approval.
- The first website capture requested a 5400-pixel clip from a 1000-pixel viewport. Chromium returned only the viewport height. The ending consequently scrolled beyond the captured content.
- The renderer now uses a 5400-pixel viewport and asserts the output is 1080 × 10800. The animation also clamps scrolling to the image bounds. The corrected export was inspected at the ending.
- The sandbox blocked localhost listeners in the review tests with `listen EPERM: operation not permitted 127.0.0.1`. The full gate passed outside the sandbox. No application or test changes were required.
- Nowledge search did not return during this turn. A second, bounded search timed out after 20 seconds. The selection and draft state are recorded in the repository.
- The actual site capture uses the built `dist/` files through intercepted local responses. It starts no server and blocks all external requests.

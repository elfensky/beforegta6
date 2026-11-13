import { LAUNCH } from '../data/site.js';
import { remaining } from '../lib/countdown.js';

// Minute steps, no seconds: a per-second ticker is auto-updating content that WCAG 2.2.2 wants a pause control for.
const target = new Date(LAUNCH.year, LAUNCH.monthIndex, LAUNCH.day).getTime();

function tick() {
  const r = remaining(Date.now(), target);
  const left = r.done ? 'It is out. Allegedly.' : `${r.days} d ${r.hours} h ${r.minutes} min to go`;
  document.querySelectorAll('[data-left]').forEach((el) => (el.textContent = left));
  if (r.done) {
    document
      .querySelectorAll('[data-launch-title]')
      .forEach((el) => (el.textContent = 'We got all of this before GTA 6.'));
    return;
  }
  setTimeout(tick, 60_000 - (Date.now() % 60_000));
}
tick();

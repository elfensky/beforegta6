// adsbygoogle.push({}) fills the next unprocessed <ins> in document order, so drop the slots CSS hid at this width first.
const slots = [...document.querySelectorAll('ins.adsbygoogle')];
const visible = slots.filter((el) => /** @type {HTMLElement} */ (el).offsetParent !== null);
slots.filter((el) => !visible.includes(el)).forEach((el) => el.remove());
// @ts-ignore adsbygoogle is AdSense's global queue.
visible.forEach(() => (window.adsbygoogle = window.adsbygoogle || []).push({}));

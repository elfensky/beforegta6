// The Umami opt-out. The deployed tracker reads localStorage['umami.disabled'] before every send.
const KEY = 'umami.disabled';
const button = /** @type {HTMLButtonElement | null} */ (document.getElementById('optout'));
const status = button?.nextElementSibling;

if (button && status) {
  let off = false;
  try {
    off = localStorage.getItem(KEY) !== null;
  } catch {
    // Storage blocked: the button still shows, and a click says why the choice cannot be saved.
  }
  const label = () => (off ? 'Count my visits again' : 'Stop counting my visits');
  button.textContent = label();
  button.hidden = false;
  button.addEventListener('click', () => {
    try {
      if (off) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, '1');
      off = !off;
      button.textContent = label();
      status.textContent = off ? 'Not counted.' : 'Counted.';
    } catch {
      status.textContent = 'This browser blocks storage, so the choice cannot be saved.';
    }
  });
}

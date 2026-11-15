// The share row stays hidden without JavaScript. The browser's share sheet where it has one, else the clipboard.
document.querySelectorAll('[data-share]').forEach((row) => {
  const button = /** @type {HTMLButtonElement} */ (row.querySelector('button'));
  const status = /** @type {HTMLElement} */ (row.querySelector('[role="status"]'));
  const url = button.dataset.url ?? location.href;
  const sheet = 'share' in navigator && typeof navigator.share === 'function';
  if (!sheet && !navigator.clipboard) return;
  button.textContent = sheet ? 'Share this card' : 'Copy link';
  /** @type {HTMLElement} */ (row).hidden = false;
  button.addEventListener('click', async () => {
    try {
      if (sheet) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        status.textContent = 'Link copied.';
      }
    } catch {
      // The visitor closed the share sheet, or the browser refused the clipboard: nothing to report.
    }
  });
});

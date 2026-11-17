// The HTML holds the production URL. Point Formspark's redirect at this origin, so staging returns to staging.
const redirect = /** @type {HTMLInputElement | null} */ (
  document.querySelector('input[name="_redirect"]')
);
if (redirect) redirect.value = new URL('/contact/sent/', location.origin).href;

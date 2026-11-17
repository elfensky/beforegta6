// The HTML holds the production URL. Point Formspark's redirect at this origin, so staging returns to staging.
const redirect = /** @type {HTMLInputElement | null} */ (
  document.querySelector('input[name="_redirect"]')
);
if (redirect) redirect.value = new URL('/contact/sent/', location.origin).href;

// Without a Turnstile token, Formspark refuses the message and shows its own error page. Keep the visitor here.
const form = document.querySelector('form.contact');
const alert = /** @type {HTMLElement | null} */ (document.getElementById('contact-alert'));
form?.addEventListener('submit', (event) => {
  const token = /** @type {HTMLInputElement | null} */ (
    form.querySelector('input[name="cf-turnstile-response"]')
  );
  if (token?.value || !alert) return;
  event.preventDefault();
  alert.hidden = false;
  alert.focus();
});

// WCAG 1.4.13: a row's hover image can cover a milestone, so Escape hides it until the pointer or focus leaves the row.
document.querySelectorAll('.entry').forEach((row) => {
  const reset = () => row.classList.remove('dismissed');
  row.addEventListener('pointerleave', reset);
  row.addEventListener('focusout', reset);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document
    .querySelectorAll('.entry:hover, .entry:focus-within')
    .forEach((row) => row.classList.add('dismissed'));
});

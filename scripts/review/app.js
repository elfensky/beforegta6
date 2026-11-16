/** @typedef {import('../lib/candidate.js').Candidate & { image: string|null }} ReviewCandidate */
/** @typedef {{ candidates: ReviewCandidate[], protectedCount: number, revision: string, token: string, syncError: string|null }} State */

/** @param {string} id @returns {HTMLElement} */
const element = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
/** @param {string} id @returns {HTMLButtonElement} */
const button = (id) => /** @type {HTMLButtonElement} */ (element(id));
/** @type {State|null} */
let state = null;
let index = 0;
let busy = false;
let stale = false;
let imageReady = false;
let focusId = null;
const visited = new Set();

/** @param {string} message */
function error(message) {
  element('error').textContent = message;
  element('error').hidden = !message;
}

/** @param {string|null|undefined} url @param {string} text */
function sourceLink(url, text) {
  if (typeof url !== 'string') return;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return;
    const link = document.createElement('a');
    link.href = parsed.href;
    link.textContent = text;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    element('sources').append(link);
  } catch {
    /* An absent or malformed URL has no link. */
  }
}

function controls() {
  const candidate = state?.candidates[index];
  for (const id of ['yes', 'no'])
    button(id).disabled = busy || stale || !candidate || !!state?.syncError;
  button('yes').disabled ||= !imageReady;
  button('skip').disabled = busy || !candidate;
  button('previous').disabled = busy || index === 0;
  button('refresh').disabled = busy;
  button('retry').hidden = !state?.syncError;
  button('retry').disabled = busy || stale;
  button('fetch').hidden = !candidate || !!candidate.image || !candidate.image_url;
  button('fetch').disabled = busy || stale;
  if (focusId && !busy) {
    const target = button(focusId);
    if (document.activeElement !== document.body && document.activeElement !== target)
      focusId = null;
    else if (!target.disabled && !target.hidden) {
      target.focus({ preventScroll: true });
      focusId = null;
    }
  }
}

function rememberFocus() {
  focusId = document.activeElement instanceof HTMLButtonElement ? document.activeElement.id : null;
}

function render() {
  const candidate = state?.candidates[index];
  if (candidate) visited.add(candidate.id);
  element('candidate').hidden = !candidate;
  if (state) {
    const holds = `${state.protectedCount} protected hold${state.protectedCount === 1 ? '' : 's'}.`;
    element('progress').textContent = candidate
      ? `Candidate ${index + 1} of ${state.candidates.length}. ${visited.size} visited. ${holds}`
      : `Review complete. ${visited.size} of ${state.candidates.length} visited. ${holds}`;
  }
  if (!candidate) {
    imageReady = false;
    controls();
    return;
  }
  for (const [id, value] of Object.entries({
    title: candidate.title,
    blurb: candidate.blurb,
    date: candidate.timeline_date ?? candidate.event_date ?? candidate.post_date ?? 'Unknown',
    tags: candidate.tags?.join(', ') || 'None',
    status: candidate.status,
  }))
    element(id).textContent = value;
  const image = /** @type {HTMLImageElement} */ (element('image'));
  image.hidden = !candidate.image;
  const src = candidate.image ? `${candidate.image}?revision=${state.revision}` : null;
  if (image.getAttribute('src') !== src) {
    imageReady = false;
    if (src) image.src = src;
    else image.removeAttribute('src');
  }
  image.alt = candidate.image_alt ?? candidate.title;
  element('missing-image').hidden = !!candidate.image;
  element('missing-image').textContent = candidate.image_url
    ? 'No local image. Fetch the image and inspect it before selecting Yes.'
    : 'No image URL. Save a local image manually, then refresh.';
  element('sources').replaceChildren();
  sourceLink(candidate.source_url, 'Source');
  sourceLink(candidate.fact_url, 'Fact source');
  sourceLink(candidate.image_page, 'Image credit');
  sourceLink(candidate.image_url, 'Image source');
  controls();
}

/** @param {string} path @param {object|null} body */
async function request(path, body = null) {
  const response = await fetch(
    path,
    body
      ? {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-review-token': state.token },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error), { saved: data.saved });
  return data;
}

async function refresh() {
  if (busy) return;
  rememberFocus();
  busy = true;
  render();
  try {
    const id = state?.candidates[index]?.id;
    state = await request('/api/state');
    // A manually replaced image can keep the same candidate revision.
    element('image').removeAttribute('src');
    imageReady = false;
    if (id)
      index = Math.max(
        0,
        state.candidates.findIndex((c) => c.id === id),
      );
    else index = Math.min(index, state.candidates.length);
    stale = false;
    error(state.syncError || '');
    element('message').textContent = '';
  } catch {
    stale = true;
    error('Cannot load review data. Check the server terminal, then refresh.');
  } finally {
    busy = false;
    render();
  }
}

/** @param {'launch'|'drop'|'sync'|'image'} action */
async function act(action) {
  if (busy || stale || !state) return;
  const candidate = state.candidates[index];
  const decision = action === 'launch' || action === 'drop';
  if (action !== 'sync' && !candidate) return;
  if (decision && (state.syncError || (action === 'launch' && !imageReady))) return;
  if (action === 'image' && (candidate.image || !candidate.image_url)) return;
  rememberFocus();
  busy = true;
  error('');
  element('message').textContent = action === 'image' ? 'Fetching image…' : 'Saving…';
  render();
  try {
    const route =
      action === 'sync' ? '/api/sync' : action === 'image' ? '/api/image' : '/api/decision';
    state = await request(route, {
      revision: state.revision,
      ...(action !== 'sync' ? { id: candidate.id } : {}),
      ...(decision ? { status: action } : {}),
    });
    if (decision) index++;
    if (action === 'image' && focusId === 'fetch') focusId = 'yes';
    element('message').textContent =
      action === 'image'
        ? 'Image saved locally. Inspect it before selecting Yes.'
        : decision
          ? 'Decision saved. Cards synchronized.'
          : 'Cards synchronized.';
  } catch (problem) {
    // A lost response may still have saved a decision. Refresh before permitting another write.
    stale = true;
    error(`${problem.message || 'Cannot confirm the decision.'} Refresh to read the saved state.`);
    element('message').textContent = '';
    if (problem.saved) {
      try {
        state = await request('/api/state');
        stale = false;
      } catch {
        /* Refresh remains available. */
      }
    }
  } finally {
    busy = false;
    render();
  }
}

button('yes').addEventListener('click', () => act('launch'));
button('no').addEventListener('click', () => act('drop'));
button('retry').addEventListener('click', () => act('sync'));
button('fetch').addEventListener('click', () => act('image'));
button('refresh').addEventListener('click', refresh);
button('skip').addEventListener('click', () => {
  if (!busy && state?.candidates[index]) {
    index++;
    render();
  }
});
button('previous').addEventListener('click', () => {
  if (!busy && index > 0) {
    index--;
    render();
  }
});

document.addEventListener('keydown', (event) => {
  if (
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    (event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, select, a, [contenteditable]'))
  )
    return;
  const status = event.key === 'ArrowRight' ? 'launch' : event.key === 'ArrowLeft' ? 'drop' : null;
  if (status && !button(status === 'launch' ? 'yes' : 'no').disabled) {
    event.preventDefault();
    act(status);
  }
});

/** @type {{ x: number, y: number, id: number }|null} */
let pointer = null;
element('candidate').addEventListener('pointerdown', (event) => {
  if (
    event.pointerType !== 'touch' ||
    !(event.target instanceof Element) ||
    event.target.closest('a, button')
  )
    return;
  pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
element('candidate').addEventListener('pointerup', (event) => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  pointer = null;
  if (Math.abs(dx) >= 80 && Math.abs(dx) > Math.abs(dy) * 1.5) act(dx > 0 ? 'launch' : 'drop');
});
element('candidate').addEventListener('pointercancel', () => {
  pointer = null;
});
element('image').addEventListener('error', () => {
  imageReady = false;
  controls();
  element('missing-image').hidden = false;
  error('The local image could not load. Check the image, then refresh.');
});
element('image').addEventListener('load', () => {
  imageReady = true;
  controls();
});

refresh();

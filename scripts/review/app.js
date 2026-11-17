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
let imageLoading = false;
let focusId = null;
const visited = new Set();
/** @type {Map<string, string>} */
const noteDrafts = new Map();
const notesInput = /** @type {HTMLTextAreaElement} */ (element('notes'));
const itemNumber = /** @type {HTMLInputElement} */ (element('item-number'));
const PROGRESS_KEY = 'beforegta6-review-progress';
const UNAVAILABLE = 'This item is not available for review. Choose an item number.';
let resumeId = null;
try {
  const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}');
  if (typeof saved?.item === 'string') resumeId = saved.item;
  if (Array.isArray(saved?.visited))
    for (const id of saved.visited) if (typeof id === 'string') visited.add(id);
} catch {
  /* Direct item URLs still work when browser storage is unavailable. */
}
const IMAGE_ERROR =
  'The local image could not load. Yes can still save your choice pending image approval.';

/** @param {ReviewCandidate|undefined} candidate */
function awaitingImage(candidate) {
  return candidate?.review_decision?.choice === 'yes' && candidate.status === 'drop';
}

function rememberPosition() {
  if (!state || index < 0) return;
  resumeId = state.candidates[index]?.id ?? resumeId;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ item: resumeId, visited: [...visited] }));
  } catch {
    /* A full or disabled store must not interrupt reviewing. */
  }
}

function indexFromUrl() {
  if (location.pathname === '/') {
    if (location.hash === '#complete') return state.candidates.length;
    return Math.max(
      0,
      state.candidates.findIndex((c) => c.id === resumeId),
    );
  }
  const id = /^\/([a-z0-9-]+)\/?$/.exec(location.pathname)?.[1];
  return state.candidates.findIndex((c) => c.id === id);
}

/** @param {'push'|'replace'} [mode] */
function updateUrl(mode = 'replace') {
  if (!state || index < 0) return;
  const candidate = state.candidates[index];
  const path = candidate ? `/${candidate.id}` : '/#complete';
  if (location.pathname + location.hash !== path)
    history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', path);
}

function notesDirty() {
  const candidate = state?.candidates[index];
  return !!candidate && noteDrafts.has(candidate.id);
}

/** @param {string} message */
function error(message) {
  element('error').textContent = message;
  element('error').hidden = !message;
}

function clearImageError() {
  if (element('error').textContent === IMAGE_ERROR) error('');
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
  button('yes').disabled ||= imageLoading;
  button('skip').disabled = busy || !candidate;
  button('previous').disabled = busy || !state || index <= 0;
  button('next').disabled = busy || !candidate || index >= state.candidates.length - 1;
  button('go').disabled = busy || !state?.candidates.length;
  itemNumber.disabled = busy || !state?.candidates.length;
  itemNumber.max = String(state?.candidates.length ?? 0);
  element('item-total').textContent = state ? `of ${state.candidates.length}` : '';
  button('refresh').disabled = busy;
  button('retry').hidden = !state?.syncError;
  button('retry').disabled = busy || stale;
  button('fetch').hidden = !candidate || !!candidate.image || !candidate.image_url;
  button('fetch').disabled = busy || stale;
  notesInput.disabled = busy || !candidate;
  button('save-notes').disabled = busy || stale || !notesDirty() || !!state?.syncError;
  element('notes-status').textContent = notesDirty()
    ? 'Unsaved notes. Save notes or move to another card to save.'
    : candidate?.review_notes
      ? 'Notes saved.'
      : '';
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
  rememberPosition();
  itemNumber.value = candidate ? String(index + 1) : '';
  element('candidate').hidden = !candidate;
  if (state) {
    const decided = state.candidates.filter((c) => c.review_decision).length;
    element('decisions').textContent = `${decided} of ${state.candidates.length} decided.`;
    const pending = state.candidates.filter(awaitingImage).length;
    element('pending-images').hidden = !pending;
    element('pending-images').textContent =
      `${pending} selected item${pending === 1 ? '' : 's'} need image approval.`;
    const holds = `${state.protectedCount} protected hold${state.protectedCount === 1 ? '' : 's'}.`;
    element('progress').textContent = candidate
      ? `Candidate ${index + 1} of ${state.candidates.length}. ${visited.size} visited. ${holds}`
      : index < 0
        ? `Item unavailable. ${state.candidates.length} candidates. ${holds}`
        : `Review complete. ${visited.size} of ${state.candidates.length} visited. ${holds}`;
  }
  if (!candidate) {
    document.title = 'Candidate review · beforegta6.wtf';
    clearImageError();
    imageReady = false;
    imageLoading = false;
    controls();
    return;
  }
  document.title = `${candidate.title} · Candidate review`;
  const decision = candidate.review_decision;
  element('decision').textContent = decision
    ? `Decided: ${decision.choice === 'yes' ? 'Yes' : 'No'}. Saved ${new Date(decision.decided_at).toLocaleString()}.`
    : 'Not decided.';
  if (noteDrafts.get(candidate.id) === (candidate.review_notes ?? ''))
    noteDrafts.delete(candidate.id);
  notesInput.value = noteDrafts.get(candidate.id) ?? candidate.review_notes ?? '';
  for (const [id, value] of Object.entries({
    title: candidate.title,
    blurb: candidate.blurb,
    date: candidate.timeline_date ?? candidate.event_date ?? candidate.post_date ?? 'Unknown',
    tags: candidate.tags?.join(', ') || 'None',
    status: awaitingImage(candidate) ? 'Needs image approval' : candidate.status,
  }))
    element(id).textContent = value;
  const image = /** @type {HTMLImageElement} */ (element('image'));
  image.hidden = !candidate.image;
  const src = candidate.image ? `${candidate.image}?revision=${state.revision}` : null;
  if (image.getAttribute('src') !== src) {
    clearImageError();
    imageReady = false;
    imageLoading = !!src;
    if (src) image.src = src;
    else image.removeAttribute('src');
  }
  image.alt = candidate.image_alt ?? candidate.title;
  element('missing-image').hidden = !!candidate.image;
  element('missing-image').textContent = candidate.image_url
    ? 'No local image. Yes saves your choice now. Fetch and inspect an image, then select Yes again to launch.'
    : 'No image URL. Yes saves your choice now. Save a local image, refresh, then select Yes again to launch.';
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
  if (!response.ok)
    throw Object.assign(new Error(data.error), { saved: data.saved, status: response.status });
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
    const ids = new Set(state.candidates.map((c) => c.id));
    for (const id of visited) if (!ids.has(id)) visited.delete(id);
    // A manually replaced image can keep the same candidate revision.
    element('image').removeAttribute('src');
    imageReady = false;
    if (id)
      index = Math.max(
        0,
        state.candidates.findIndex((c) => c.id === id),
      );
    else index = indexFromUrl();
    updateUrl();
    stale = false;
    error(state.syncError || (index < 0 ? UNAVAILABLE : ''));
    element('message').textContent = '';
  } catch {
    stale = true;
    error('Cannot load review data. Check the server terminal, then refresh.');
  } finally {
    busy = false;
    render();
  }
}

/** @param {'launch'|'drop'|'sync'|'image'|'notes'} action */
async function act(action) {
  if (busy || stale || !state) return false;
  const candidate = state.candidates[index];
  const decision = action === 'launch' || action === 'drop';
  if (action !== 'sync' && !candidate) return false;
  if (decision && (state.syncError || (action === 'launch' && imageLoading))) return false;
  if (action === 'image' && (candidate.image || !candidate.image_url)) return false;
  if (action === 'notes' && state.syncError) return false;
  if (action === 'notes' && !notesDirty()) return true;
  rememberFocus();
  busy = true;
  error('');
  element('message').textContent = action === 'image' ? 'Fetching image…' : 'Saving…';
  render();
  try {
    if (action !== 'sync' && notesDirty()) {
      state = await request('/api/notes', {
        id: candidate.id,
        notes: noteDrafts.get(candidate.id),
        revision: state.revision,
      });
      noteDrafts.delete(candidate.id);
    }
    if (action !== 'notes') {
      const route =
        action === 'sync' ? '/api/sync' : action === 'image' ? '/api/image' : '/api/decision';
      state = await request(route, {
        revision: state.revision,
        ...(action !== 'sync' ? { id: candidate.id } : {}),
        ...(decision ? { status: action, imageReady } : {}),
      });
    }
    if (decision) {
      index++;
      updateUrl('push');
    }
    if (action === 'image' && focusId === 'fetch') focusId = 'yes';
    element('message').textContent =
      action === 'image'
        ? 'Image saved locally. Inspect it before selecting Yes.'
        : action === 'notes'
          ? 'Notes saved.'
          : decision
            ? awaitingImage(state.candidates.find((c) => c.id === candidate.id))
              ? 'Yes saved. Image approval needed before launch.'
              : 'Decision saved. Cards synchronized.'
            : 'Cards synchronized.';
    return true;
  } catch (problem) {
    // A rejected request did not write. Only conflicts, access failures, and uncertain saves need a refresh.
    const rejected = !problem.saved && [400, 404, 413, 422].includes(problem.status);
    stale = !rejected;
    const next = stale
      ? ' Refresh to read the saved state.'
      : action === 'image'
        ? ' You can still save Yes, save notes, skip this card, or retry the image.'
        : '';
    error(`${problem.message || 'Cannot confirm the save.'}${next}`);
    element('message').textContent = '';
    if (problem.saved) {
      try {
        state = await request('/api/state');
        stale = false;
      } catch {
        /* Refresh remains available. */
      }
    }
    return false;
  } finally {
    busy = false;
    render();
  }
}

/** @param {number} next @param {'push'|'replace'} [mode] */
async function navigate(next, mode = 'push') {
  if (busy || !state || (notesDirty() && !(await act('notes')))) {
    if (mode === 'replace') updateUrl();
    return;
  }
  if (next < -1 || next > state.candidates.length) return;
  index = next;
  updateUrl(mode);
  if (index < 0) error(UNAVAILABLE);
  else if (element('error').textContent === UNAVAILABLE || itemNumber.hasAttribute('aria-invalid'))
    error('');
  itemNumber.removeAttribute('aria-invalid');
  render();
}

/** @param {number} delta */
function move(delta) {
  if (!state || (delta < 0 ? index <= 0 : !state.candidates[index])) return;
  return navigate(index + delta);
}

button('yes').addEventListener('click', () => act('launch'));
button('no').addEventListener('click', () => act('drop'));
button('retry').addEventListener('click', () => act('sync'));
button('fetch').addEventListener('click', () => act('image'));
button('refresh').addEventListener('click', refresh);
button('save-notes').addEventListener('click', () => act('notes'));
button('skip').addEventListener('click', () => move(1));
button('previous').addEventListener('click', () => move(-1));
button('next').addEventListener('click', () => move(1));
element('jump-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!state || busy) return;
  const number = Number(itemNumber.value);
  if (!Number.isInteger(number) || number < 1 || number > state.candidates.length) {
    itemNumber.setAttribute('aria-invalid', 'true');
    error(`Enter an item number from 1 to ${state.candidates.length}.`);
    return;
  }
  navigate(number - 1);
});
window.addEventListener('popstate', () => {
  if (state) navigate(indexFromUrl(), 'replace');
});
notesInput.addEventListener('input', () => {
  const candidate = state?.candidates[index];
  if (!candidate) return;
  if (notesInput.value === (candidate.review_notes ?? '')) noteDrafts.delete(candidate.id);
  else noteDrafts.set(candidate.id, notesInput.value);
  controls();
});
window.addEventListener('beforeunload', (event) => {
  if (!noteDrafts.size) return;
  event.preventDefault();
  event.returnValue = '';
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
    event.target.closest('a, button, input, textarea, select, [contenteditable]')
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
  imageLoading = false;
  controls();
  element('missing-image').hidden = false;
  error(IMAGE_ERROR);
});
element('image').addEventListener('load', () => {
  imageReady = true;
  imageLoading = false;
  clearImageError();
  controls();
});

refresh();

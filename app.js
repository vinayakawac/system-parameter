import { parameters, validate } from './data.js';

const paths = {
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  sliders: '<path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="12" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14l-1 7 6-2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const $ = id => document.getElementById(id);
const storageKey = 'rxd-system-parameters-v1';
let persisted = {};
try { persisted = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* The sample defaults remain available when storage is unavailable. */ }
const baseline = new Map(parameters.map(p => [p.id, typeof persisted[p.id] === 'string' && !validate(p, persisted[p.id]) ? persisted[p.id] : p.value]));
const drafts = new Map(baseline);
const errors = new Map();
let filter = 'all';
let page = 1;
let saving = false;
let savedAt = null;
let toastTimer;
const PAGE_SIZE = 48;
const dirty = () => parameters.filter(p => drafts.get(p.id) !== baseline.get(p.id));
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function matching() {
  const query = $('parameter-search').value.trim().toLowerCase();
  return parameters.filter(p => (filter === 'all' || drafts.get(p.id) !== baseline.get(p.id)) && (!query || [p.name, drafts.get(p.id), p.accepted, p.remarks].some(v => v.toLowerCase().includes(query))));
}
function updateStatus() {
  const changed = dirty().length;
  $('modified-count').textContent = changed;
  $('modified-filter').classList.toggle('has-changes', changed > 0);
  document.querySelector('.save-bar').classList.toggle('has-changes', changed > 0);
  $('save-button').disabled = !changed || saving;
  $('discard-button').disabled = !changed || saving;
  $('save-label').textContent = saving ? 'Saving…' : 'Save changes';
  $('status-icon').innerHTML = icon(saving ? 'clock' : changed ? 'edit' : 'check-circle');
  $('status-title').textContent = saving ? 'Saving your changes' : changed ? `${changed} unsaved ${changed === 1 ? 'change' : 'changes'}` : savedAt ? 'All changes saved' : 'No unsaved changes';
  $('status-detail').textContent = savedAt && !changed && !saving ? `Saved in this browser at ${savedAt}.` : '';
  $('status-detail').hidden = !$('status-detail').textContent;
}
function render({ resetScroll = false } = {}) {
  const records = matching();
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const start = (page - 1) * PAGE_SIZE;
  const visible = records.slice(start, start + PAGE_SIZE);
  $('parameter-rows').innerHTML = visible.map(p => {
    const value = drafts.get(p.id);
    const modified = value !== baseline.get(p.id);
    const error = errors.get(p.id);
    return `<tr data-id="${p.id}" class="${modified ? 'modified' : ''}"><td><span class="parameter-name" title="${escape(p.name)}">${escape(p.name)}</span></td><td><div class="value-wrap"><input class="parameter-input" type="text" value="${escape(value)}" data-id="${p.id}" aria-label="${escape(p.name)} value" aria-describedby="accepted-${p.id}${error ? ` error-${p.id}` : ''}" aria-invalid="${Boolean(error)}" ${saving ? 'disabled' : ''} autocomplete="off" spellcheck="false"><span class="modified-marker" ${modified ? '' : 'hidden'} aria-label="Modified" role="img"></span></div><span class="field-error" id="error-${p.id}" ${error ? '' : 'hidden'}>${escape(error || '')}</span></td><td><span id="accepted-${p.id}" class="accepted-text" title="${escape(p.accepted)}">${escape(p.accepted)}</span></td><td><span class="remark-text" title="${escape(p.remarks)}">${escape(p.remarks)}</span></td></tr>`;
  }).join('');
  $('total-count').textContent = parameters.length;
  $('range-label').innerHTML = records.length ? `Showing <strong>${start + 1}–${Math.min(start + PAGE_SIZE, records.length)}</strong> of <strong>${records.length}</strong> parameters` : '0 parameters';
  $('page-label').textContent = `${page} of ${pages}`;
  $('previous-page').disabled = page <= 1;
  $('next-page').disabled = page >= pages;
  $('no-results').hidden = records.length > 0;
  if (!records.length) {
    $('no-results').querySelector('h3').textContent = filter === 'modified' && !$('parameter-search').value ? 'No modified parameters' : 'No matching parameters';
    $('no-results').querySelector('p').textContent = filter === 'modified' && !$('parameter-search').value ? 'Your changes will appear here as you edit parameter values.' : 'Try a different name, value, or remark.';
    $('clear-filters').textContent = filter === 'modified' && !$('parameter-search').value ? 'View all parameters' : 'Clear filters';
  }
  for (const name of ['all', 'modified']) {
    $(`${name}-filter`).classList.toggle('active', filter === name);
    $(`${name}-filter`).setAttribute('aria-pressed', String(filter === name));
  }
  if (resetScroll) $('table-viewport').scrollTop = 0;
  updateStatus();
}
function showFieldError(input, message) {
  const id = input.dataset.id;
  if (message) errors.set(id, message); else errors.delete(id);
  input.setAttribute('aria-invalid', String(Boolean(message)));
  input.setAttribute('aria-describedby', `accepted-${id}${message ? ` error-${id}` : ''}`);
  const field = $(`error-${id}`);
  field.hidden = !message;
  field.textContent = message;
}
$('parameter-rows').addEventListener('input', event => {
  const input = event.target;
  if (!input.matches('.parameter-input') || saving) return;
  drafts.set(input.dataset.id, input.value);
  const modified = input.value !== baseline.get(input.dataset.id);
  input.closest('tr').classList.toggle('modified', modified);
  input.parentElement.querySelector('.modified-marker').hidden = !modified;
  if (errors.has(input.dataset.id)) showFieldError(input, '');
  $('save-error').hidden = true;
  savedAt = null;
  updateStatus();
});
$('parameter-rows').addEventListener('focusout', event => {
  const input = event.target;
  if (!input.matches('.parameter-input') || saving) return;
  const p = parameters.find(p => p.id === input.dataset.id);
  showFieldError(input, drafts.get(p.id) === baseline.get(p.id) ? '' : validate(p, input.value));
  // Defer filtering until the user leaves the input, so editing never loses focus.
  if (filter === 'modified' && drafts.get(p.id) === baseline.get(p.id)) {
    const nextId = event.relatedTarget?.dataset?.id;
    setTimeout(() => { render(); if (nextId) document.querySelector(`input[data-id="${nextId}"]`)?.focus(); }, 0);
  }
});
for (const name of ['all', 'modified']) $(`${name}-filter`).addEventListener('click', () => { filter = name; page = 1; render({ resetScroll: true }); });
$('parameter-search').addEventListener('input', () => { page = 1; render({ resetScroll: true }); });
$('clear-filters').addEventListener('click', () => { filter = 'all'; $('parameter-search').value = ''; page = 1; render({ resetScroll: true }); $('parameter-search').focus(); });
$('previous-page').addEventListener('click', () => { page--; render({ resetScroll: true }); });
$('next-page').addEventListener('click', () => { page++; render({ resetScroll: true }); });
function toast(message) {
  clearTimeout(toastTimer);
  $('toast-text').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}
$('dismiss-toast').addEventListener('click', () => { $('toast').hidden = true; clearTimeout(toastTimer); });
$('discard-button').addEventListener('click', () => {
  if (saving) return;
  const count = dirty().length;
  for (const [id, value] of baseline) drafts.set(id, value);
  errors.clear();
  $('save-error').hidden = true;
  render();
  toast(`${count} ${count === 1 ? 'change' : 'changes'} discarded.`);
});
async function save() {
  const changed = dirty();
  if (!changed.length || saving) return;
  errors.clear();
  for (const p of changed) {
    const error = validate(p, drafts.get(p.id));
    if (error) errors.set(p.id, error);
  }
  if (errors.size) {
    const first = errors.keys().next().value;
    filter = 'all';
    $('parameter-search').value = '';
    page = Math.floor(parameters.findIndex(p => p.id === first) / PAGE_SIZE) + 1;
    render();
    $('save-error').textContent = `Couldn't save. Correct ${errors.size === 1 ? 'the highlighted value' : `the ${errors.size} highlighted values`} and try again. Your changes are preserved.`;
    $('save-error').hidden = false;
    const input = document.querySelector(`input[data-id="${first}"]`);
    input.focus({ preventScroll: true });
    input.scrollIntoView({ block: 'center' });
    return;
  }
  saving = true;
  $('save-error').hidden = true;
  render();
  try {
    // Simulates one atomic save task; replace with the documented service adapter.
    await new Promise(resolve => setTimeout(resolve, 600));
    localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(drafts)));
    for (const [id, value] of drafts) baseline.set(id, value);
    savedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    toast(`${changed.length} ${changed.length === 1 ? 'parameter' : 'parameters'} saved successfully.`);
  } catch {
    $('save-error').textContent = "Couldn't save in this browser. Your changes are preserved. Check browser storage availability and try again.";
    $('save-error').hidden = false;
  } finally { saving = false; render(); }
}
$('save-button').addEventListener('click', save);
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); if (!$('help-dialog').open) save(); }
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !$('help-dialog').open && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); $('parameter-search').focus(); }
});
window.addEventListener('beforeunload', event => { if (dirty().length) { event.preventDefault(); event.returnValue = ''; } });
$('help-button').addEventListener('click', () => $('help-dialog').showModal());
$('close-help').addEventListener('click', () => $('help-dialog').close());
$('help-dialog').addEventListener('click', event => { if (event.target === $('help-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
render();

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  NbBadge, NbBreadcrumbs, NbButton, NbDialogModal, NbEmptyState, NbHeading, NbHyperlink,
  NbLoader, NbPagination, NbParagraph, NbTable, NbTextbox,
} from '@ramco-platform/studio-components';
import { parameters, validate } from './data.js';
import './styles.css';

// Body-only page: the navbar, sidebar and app shell come from the runtime (rui-page-builder golden example).
// Composition plan: docs/ui-design-doc_system-parameter.md

const STORAGE_KEY = 'rxd-system-parameters-v1';
const PAGE_SIZE = 48;
function loadValues() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { /* Use sample defaults. */ }
  return Object.fromEntries(parameters.map(p => [p.id,
    typeof saved[p.id] === 'string' && !validate(p, saved[p.id]) ? saved[p.id] : p.value,
  ]));
}

const SystemParameterPage = () => {
  const [baseline, setBaseline] = useState(loadValues);
  const [drafts, setDrafts] = useState(() => ({ ...baseline }));
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const savingRef = useRef(false);
  const searchRef = useRef(null);
  const gridRef = useRef(null);
  const editorRefs = useRef({});
  const [focusId, setFocusId] = useState(null);
  const changed = parameters.filter(p => drafts[p.id] !== baseline[p.id]);
  const normalizedQuery = query.trim().toLowerCase();
  const records = parameters.filter(p => p.id === activeId ||
    !normalizedQuery || [p.name, drafts[p.id], p.accepted, p.remarks]
      .some(value => value.toLowerCase().includes(normalizedQuery)));
  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = records.slice(start, start + PAGE_SIZE);

  useEffect(() => { gridRef.current?.scrollTo({ top: 0 }); }, [currentPage, query]);
  useEffect(() => {
    if (!focusId) return;
    const input = editorRefs.current[focusId]?.current;
    if (input) {
      input.focus({ preventScroll: true });
      input.scrollIntoView({ block: 'center' });
      setFocusId(null);
    }
  }, [focusId, currentPage]);

  function edit(p, value) {
    if (savingRef.current) return;
    setActiveId(p.id);
    setDrafts(previous => ({ ...previous, [p.id]: value }));
    setErrors(previous => ({ ...previous, [p.id]: '' }));
    setSaveError('');
    setNotice('');
  }
  function blur(p, value) {
    setErrors(previous => ({ ...previous, [p.id]: value === baseline[p.id] ? '' : validate(p, value) }));
    setActiveId(null);
  }
  function clearFilters() {
    setQuery(''); setPage(1); setActiveId(null);
    searchRef.current?.focus();
  }
  async function save() {
    if (!changed.length || savingRef.current) return;
    const nextErrors = Object.fromEntries(changed.map(p => [p.id, validate(p, drafts[p.id])]).filter(([, error]) => error));
    setErrors(nextErrors);
    const invalidIds = Object.keys(nextErrors);
    if (invalidIds.length) {
      const first = invalidIds[0];
      setQuery(''); setActiveId(null);
      setPage(Math.floor(parameters.findIndex(p => p.id === first) / PAGE_SIZE) + 1);
      setSaveError(`Correct ${invalidIds.length === 1 ? 'the highlighted value' : `the ${invalidIds.length} highlighted values`} and save again. Your changes are preserved.`);
      setNotice(''); setFocusId(first);
      return;
    }
    savingRef.current = true;
    setSaving(true); setSaveError(''); setNotice(''); setActiveId(null);
    const snapshot = { ...drafts };
    try {
      // Replace with the PRD's batch save service when its contract is available.
      await new Promise(resolve => setTimeout(resolve, 600));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      setBaseline(snapshot);
      setNotice(`${changed.length} ${changed.length === 1 ? 'parameter' : 'parameters'} saved in this browser.`);
    } catch {
      setSaveError("Couldn't save in this browser. Your changes are preserved. Check browser storage availability and retry.");
    } finally { savingRef.current = false; setSaving(false); }
  }
  function discard() {
    if (savingRef.current) return;
    setDrafts({ ...baseline }); setErrors({}); setSaveError(''); setActiveId(null);
    setNotice(`${changed.length} ${changed.length === 1 ? 'change' : 'changes'} discarded.`);
  }
  useEffect(() => {
    function keydown(event) {
      if (helpOpen) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault(); save();
      }
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey &&
          !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault(); searchRef.current?.focus();
      }
    }
    function beforeUnload(event) {
      if (changed.length) { event.preventDefault(); event.returnValue = ''; }
    }
    document.addEventListener('keydown', keydown);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  });

  const tableData = { data: visible.map(p => {
    editorRefs.current[p.id] ||= React.createRef();
    const modified = drafts[p.id] !== baseline[p.id];
    return { id: `row-${p.id}-`, text: [
      <NbParagraph key={`name-${p.id}`} id={`name-${p.id}`} content={p.name} size="font-13" weight="font-medium" enableTooltip />,
      <div key={`value-${p.id}`} className="flex items-start gap-2">
        <NbTextbox id={`value-${p.id}`} ref={editorRefs.current[p.id]}
          name={p.id} caption={`${p.name} value`} hideCaption size="medium" variant="standard"
          value={drafts[p.id]} disabled={saving} enableInheritWidth autoFill="off" disableSanitize
          error={Boolean(errors[p.id])} helpTask={errors[p.id] || undefined}
          ariaDescribedby={errors[p.id] ? undefined : `accepted-${p.id}`}
          onChange={({ value }) => edit(p, value)} onBlur={({ event }) => blur(p, event.target.value)} />
        <div className={`flex h-9 shrink-0 items-center${modified ? '' : ' invisible'}`} aria-hidden={!modified}>
          <NbBadge id={`modified-${p.id}`} content="Modified" color="primary" size="medium" />
        </div>
      </div>,
      <NbParagraph key={`accepted-${p.id}`} id={`accepted-${p.id}`} content={p.accepted} size="font-13" enableTooltip />,
      <NbParagraph key={`remarks-${p.id}`} id={`remarks-${p.id}`} content={p.remarks} size="font-13" enableTooltip />,
    ] };
  }) };

  const statusText = saving ? 'Saving changes…'
    : changed.length ? `${changed.length} unsaved ${changed.length === 1 ? 'change' : 'changes'}`
    : notice || 'No unsaved changes';

  return (
    <div className="theme-rxd flex h-screen overflow-hidden bg-white">
      {/* Blank rail: reserves the runtime shell's sidebar width in this standalone prototype. */}
      <div className="w-14 shrink-0 border-r border-gray-200" aria-hidden="true" />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-2 focus-within:left-4 focus-within:z-50 focus-within:p-2">
        <NbHyperlink id="skip-to-main" url="#main" content="Skip to parameters" openLinkinSamePage variant="primary" wordWrap="nowrap" />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
        <NbBreadcrumbs id="breadcrumbs" items={[{ value: 'Administration' }, { value: 'System parameter' }]} handleBreadcrumbClick={() => {}} />
        <div className="flex items-center gap-2">
          <NbBadge id="sample-data" content="Sample data" color="neutral" size="medium" />
          <NbButton id="help-button" caption="Help" ariaLabel="About this prototype" variant="ghost" size="medium" onClick={() => setHelpOpen(true)} />
        </div>
      </div>

      <section id="main" tabIndex={-1} className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <div className="flex shrink-0 flex-col gap-2">
          <NbHeading id="page-title" content="System Parameter" tag="h2" weight="font-semibold" />
          <NbParagraph id="page-description" content="Edit System Parameter Value using the listed accepted values. Save changes applies all modified rows." size="font-13" color="neutral" />
        </div>

        <div id="parameter-panel" className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex shrink-0 items-center gap-2">
              <NbHeading id="grid-title" content="Parameter details" tag="h4" weight="font-semibold" />
              <NbBadge id="total-count" content={parameters.length} color="neutral" size="medium" />
            </div>

            <div className="flex shrink-0 md:justify-end">
              <div className="max-md:w-full md:w-80 shrink-0">
                <NbTextbox id="parameter-search" ref={searchRef} name="search" caption="Search parameters" hideCaption
                  value={query} placeholder="Search parameters…" autoFill="off" size="medium" enableInheritWidth
                  startIcon={{ iconKey: 'Search' }}
                  onChange={({ value }) => { setQuery(value); setPage(1); setActiveId(null); }} />
              </div>
            </div>

            {saveError && <div role="alert"><NbParagraph id="save-error" content={saveError} color="error" size="font-14" enableWordWrap /></div>}

            <div className="relative min-h-0 flex-1 overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_.NbTable]:overflow-visible!" ref={gridRef} tabIndex={0} aria-label="Scrollable parameter grid">
              {saving && <NbLoader id="parameter-loader" active withOverlay={false} size="medium" position="container" caption="Saving…" enableCaption />}
              <div>
                <NbTable id="parameter-table" hideCaption
                  caption="System parameters. Only System Parameter Value is editable."
                  enableHeader enableFooter={false} variant="default"
                  headerData={{ id: 'column-', data: ['System Parameter Name', 'System Parameter Value', 'Accepted Value', 'Remarks'], columnWidth: ['25%', '25%', '22%', '28%'] }} tableData={tableData} />
              </div>
              {!records.length && <NbEmptyState id="empty-state" enableText enableSubText enableButton1
                enableImage={false} enableButton2={false}
                text={{ id: 'empty-title', tag: 'h4', weight: 'font-semibold', content: 'No matching parameters' }}
                subText={{ id: 'empty-description', size: 'font-14', content: 'Try a different name, value, or remark.' }}
                button1={{ id: 'clear-filters', caption: 'View all parameters', variant: 'secondary', size: 'medium', onClick: clearFilters }} />}
            </div>

            <div className="flex shrink-0 max-md:flex-col gap-4 md:items-center md:justify-between">
              <NbParagraph id="range-label" size="font-13" color="neutral" content={records.length ? `${start + 1}–${Math.min(start + PAGE_SIZE, records.length)} of ${records.length} parameters · 48 per page` : '0 parameters'} />
              <NbPagination id="pagination" variant="number" activePage={currentPage} pageCount={pageCount}
                enablePrevLink enableNextLink enableFirstLink={false} enableLastLink={false} enableGoToBox={false}
                pageRangeDisplayed={3} breakLabel="…" onPageChange={(_, next) => setPage(Math.max(1, Math.min(next, pageCount)))} />
            </div>
        </div>

      </section>

      {/* Sticky action bar: stands in for the runtime shell's footer surface in this standalone prototype. */}
      <div className="flex shrink-0 max-md:flex-col gap-4 bg-white px-12 py-6 md:items-center md:justify-between">
          <div role="status" aria-atomic="true">
            <NbParagraph id="status-title" size="font-14" weight="font-medium" content={statusText} />
          </div>
          <div className="flex items-center gap-2">
            <NbButton id="discard-button" caption="Discard changes" variant="secondary" size="medium" disabled={!changed.length || saving} onClick={discard} />
            <NbButton id="save-button" caption={saving ? 'Saving…' : 'Save changes'} variant="primary" size="medium" disabled={!changed.length || saving} startIcon={{ iconKey: 'Save' }} onClick={save} />
          </div>
      </div>

      <NbDialogModal id="help-dialog" modalOpen={helpOpen} onClose={() => setHelpOpen(false)}
        variant="dialog" size="sm" enableHeader enableCloseIcon enableFooter
        headerDetail={{ titleTemplate: { id: 'help-title', content: 'System Parameter help', tag: 'h4', weight: 'font-semibold' } }}
        body={<div className="flex flex-col gap-4">
          <NbParagraph id="help-sample" content="Sample data. Changes are saved in this browser only." size="font-14" enableWordWrap />
          <NbParagraph id="help-edit" content="Edit System Parameter Value using the listed accepted values. Save changes applies all modified rows." size="font-14" enableWordWrap />
          <NbParagraph id="help-shortcuts" content="Shortcuts: / to search, Tab to move between values, Ctrl or Cmd + S to save." size="font-14" enableWordWrap />
        </div>}
        footerRight={{ primaryButtonProps: { id: 'help-done', caption: 'Done', variant: 'primary', size: 'medium', onClick: () => setHelpOpen(false) } }} />
      </div>
    </div>
  );
};

export default SystemParameterPage;

createRoot(document.getElementById('root')).render(<SystemParameterPage />);

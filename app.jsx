import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  NbBadge, NbBreadcrumbs, NbButton, NbDialogModal, NbEmptyState,
  NbHeading, NbHyperlink, NbPagination, NbPanel, NbParagraph, NbTable, NbTextbox,
} from '@ramco-platform/studio-components';
import { parameters, validate } from './data.js';
import './styles.css';

const STORAGE_KEY = 'rxd-system-parameters-v1';
const PAGE_SIZE = 48;
function loadValues() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { /* Use sample defaults. */ }
  return Object.fromEntries(parameters.map(p => [p.id,
    typeof saved[p.id] === 'string' && !validate(p, saved[p.id]) ? saved[p.id] : p.value,
  ]));
}

function App() {
  const [baseline, setBaseline] = useState(loadValues);
  const [drafts, setDrafts] = useState(() => ({ ...baseline }));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
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
    ((filter === 'all' || drafts[p.id] !== baseline[p.id]) &&
      (!normalizedQuery || [p.name, drafts[p.id], p.accepted, p.remarks]
        .some(value => value.toLowerCase().includes(normalizedQuery)))));
  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = records.slice(start, start + PAGE_SIZE);

  useEffect(() => { gridRef.current?.scrollTo({ top: 0 }); }, [currentPage, query, filter]);
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
    setQuery(''); setFilter('all'); setPage(1); setActiveId(null);
    searchRef.current?.focus();
  }
  async function save() {
    if (!changed.length || savingRef.current) return;
    const nextErrors = Object.fromEntries(changed.map(p => [p.id, validate(p, drafts[p.id])]).filter(([, error]) => error));
    setErrors(nextErrors);
    const invalidIds = Object.keys(nextErrors);
    if (invalidIds.length) {
      const first = invalidIds[0];
      setFilter('all'); setQuery(''); setActiveId(null);
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
      <NbParagraph key={`name-${p.id}`} id={`name-${p.id}`} content={p.name} size="font-13" weight="font-medium" />,
      <NbTextbox key={`value-${p.id}`} id={`value-${p.id}`} ref={editorRefs.current[p.id]}
        name={p.id} caption={`${p.name} value`} hideCaption size="small" variant="standard"
        value={drafts[p.id]} disabled={saving} enableInheritWidth autoFill="off" disableSanitize
        className={modified ? 'parameter-editor is-modified' : 'parameter-editor'}
        error={Boolean(errors[p.id])} helpTask={errors[p.id] || undefined}
        ariaDescribedby={errors[p.id] ? undefined : `accepted-${p.id}`}
        onChange={({ value }) => edit(p, value)} onBlur={({ event }) => blur(p, event.target.value)} />,
      <NbParagraph key={`accepted-${p.id}`} id={`accepted-${p.id}`} content={p.accepted} size="font-13" enableTooltip />,
      <NbParagraph key={`remarks-${p.id}`} id={`remarks-${p.id}`} content={p.remarks} size="font-13" enableTooltip />,
    ] };
  }) };

  return <>
    <div className="skip-link"><NbHyperlink id="skip-to-main" url="#main" content="Skip to parameters" openLinkinSamePage variant="primary" wordWrap="nowrap" /></div>
    <aside className="app-sidebar" aria-label="Application navigation">
      <NbParagraph id="nav-section" content="Administration" size="font-13" weight="font-medium" />
      <NbHyperlink id="nav-current" url="#main" content="System parameter" openLinkinSamePage variant="primary" wordWrap="nowrap" startIcon={{ iconKey: 'Settings2' }} />
    </aside>
    <div className="app">
      <header className="topbar">
        <NbBreadcrumbs id="breadcrumbs" items={[{ value: 'Administration' }, { value: 'System parameter' }]} handleBreadcrumbClick={() => {}} />
        <div className="topbar-actions">
          <NbBadge id="sample-data" content="Sample data" color="neutral" size="small" />
          <NbButton id="help-button" caption="Help" ariaLabel="About this prototype" variant="ghost" size="small" onClick={() => setHelpOpen(true)} />
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <NbHeading id="page-title" content="System Parameter" tag="h1" fontSize="font-24" weight="font-semibold" />
        <NbPanel id="parameter-panel" className="parameter-panel" showHeader={false} hideCaption enableborder enableShadow={false} enablePadding={false}>
          <div className="panel-heading">
            <NbHeading id="grid-title" content="Parameter details" tag="h2" fontSize="font-16" weight="font-semibold" />
            <NbBadge id="total-count" content={parameters.length} color="neutral" size="small" />
          </div>
          <div className="panel-toolbar">
            <div className="filter-actions" role="group" aria-label="Filter parameters">
              <NbButton id="filter-all" caption="All parameters" variant={filter === 'all' ? 'secondary' : 'ghost'} size="small" ariaPressed={filter === 'all'} onClick={() => { setFilter('all'); setPage(1); }} />
              <NbButton id="filter-modified" caption={`Modified (${changed.length})`} variant={filter === 'modified' ? 'secondary' : 'ghost'} size="small" ariaPressed={filter === 'modified'} onClick={() => { setFilter('modified'); setPage(1); }} />
            </div>
            <NbTextbox id="parameter-search" ref={searchRef} name="search" caption="Search parameters" hideCaption
              value={query} placeholder="Search parameters…" autoFill="off" size="large" width="100%"
              className="parameter-search" startIcon={{ iconKey: 'Search' }}
              onChange={({ value }) => { setQuery(value); setPage(1); setActiveId(null); }} />
          </div>
          {saveError && <div className="save-error" role="alert"><NbParagraph id="save-error" content={saveError} color="error" size="font-14" enableWordWrap /></div>}
          <div className="table-viewport" ref={gridRef} tabIndex={0} aria-label="Scrollable parameter grid, 16 visible rows">
            <NbTable id="parameter-table" className="parameter-table" hideCaption
              caption="System parameters. Only System Parameter Value is editable."
              enableHeader enableFooter={false} variant="default"
              headerData={{ id: 'column-', data: ['System Parameter Name', 'System Parameter Value', 'Accepted Value', 'Remarks'], columnWidth: ['25%', '21%', '24%', '30%'] }} tableData={tableData} />
            {!records.length && <NbEmptyState id="empty-state" enableText enableSubText enableButton1
              enableImage={false} enableButton2={false}
              text={{ id: 'empty-title', tag: 'h3', fontSize: 'font-16', content: filter === 'modified' && !query ? 'No modified parameters' : 'No matching parameters' }}
              subText={{ id: 'empty-description', size: 'font-14', content: filter === 'modified' && !query ? 'Your changes will appear here as you edit values.' : 'Try a different name, value, or remark.' }}
              button1={{ id: 'clear-filters', caption: 'View all parameters', variant: 'secondary', onClick: clearFilters }} />}
          </div>
          <div className="pagination-bar">
            <NbParagraph id="range-label" size="font-13" content={records.length ? `${start + 1}–${Math.min(start + PAGE_SIZE, records.length)} of ${records.length} parameters · 48 per page` : '0 parameters'} />
            <NbPagination id="pagination" variant="number" activePage={currentPage} pageCount={pageCount}
              enablePrevLink enableNextLink enableFirstLink={false} enableLastLink={false} enableGoToBox={false}
              pageRangeDisplayed={3} breakLabel="…" onPageChange={(_, next) => setPage(Math.max(1, Math.min(next, pageCount)))} />
          </div>
        </NbPanel>
      </main>
      <footer className="save-bar">
        <div className="save-status" role="status" aria-atomic="true">
          <NbParagraph id="status-title" size="font-14" weight="font-medium"
            content={saving ? 'Saving changes…' : changed.length ? `${changed.length} unsaved ${changed.length === 1 ? 'change' : 'changes'}` : notice || 'No unsaved changes'} />
        </div>
        <div className="save-actions">
          <NbButton id="discard-button" caption="Discard changes" variant="secondary" size="medium" disabled={!changed.length || saving} onClick={discard} />
          <NbButton id="save-button" caption={saving ? 'Saving…' : 'Save changes'} variant="primary" size="medium" disabled={!changed.length || saving} startIcon={{ iconKey: 'Save' }} onClick={save} />
        </div>
      </footer>
    </div>
    <NbDialogModal id="help-dialog" modalOpen={helpOpen} onClose={() => setHelpOpen(false)}
      variant="dialog" size="sm" enableHeader enableCloseIcon enableFooter
      headerDetail={{ titleTemplate: { id: 'help-title', content: 'System Parameter help', tag: 'h2', fontSize: 'font-18' } }}
      body={<div className="help-content">
        <NbParagraph id="help-sample" content="Sample data. Changes are saved in this browser only." size="font-14" enableWordWrap />
        <NbParagraph id="help-edit" content="Edit System Parameter Value using the listed accepted values. Save changes applies all modified rows." size="font-14" enableWordWrap />
        <NbParagraph id="help-shortcuts" content="Shortcuts: / to search, Tab to move between values, Ctrl or ⌘ + S to save." size="font-14" enableWordWrap />
      </div>}
      footerRight={{ primaryButtonProps: { id: 'help-done', caption: 'Done', variant: 'primary', onClick: () => setHelpOpen(false) } }} />
  </>;
}

createRoot(document.getElementById('root')).render(<App />);

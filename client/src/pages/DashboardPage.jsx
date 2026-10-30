import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, ClipboardList, Download, Inbox, LogOut, RefreshCw,
  Search, SearchX, Sparkles, Timer, CheckCircle2, TrendingUp, X,
} from 'lucide-react';
import { Brand, ThemeToggle } from '../components/Brand.jsx';
import InquiryDrawer, { CategoryBadge, StatusBadge } from '../components/InquiryDrawer.jsx';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api';
import { CATEGORIES, STATUSES, USER_TYPES, formatDate } from '../constants';

const LIMIT = 10;
const INITIAL_FILTERS = { search: '', category: '', userType: '', status: '' };

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function StatCard({ icon: Icon, label, value, tone, loading }) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="stat-icon"><Icon size={20} /></span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{loading ? <span className="skel w-12" /> : value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);

  const debouncedSearch = useDebounced(filters.search);
  const reqId = useRef(0);

  const activeFilters = { ...filters, search: debouncedSearch };
  const hasFilters = Object.values(filters).some(Boolean);

  const loadStats = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  const loadList = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.listInquiries({ ...activeFilters, page, limit: LIMIT });
      if (id !== reqId.current) return; // stale response
      setRows(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (id === reqId.current) setError(err.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.userType, filters.status, page]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };
  const clearFilters = () => { setFilters(INITIAL_FILTERS); setPage(1); };

  async function changeStatus(inquiry, status) {
    setBusy(true);
    try {
      const { inquiry: updated } = await api.updateStatus(inquiry.id, status);
      setRows((r) => r.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
      loadStats();
      toast(`Marked as ${status}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    const target = confirm;
    setBusy(true);
    try {
      await api.remove(target.id);
      setConfirm(null);
      setSelected(null);
      toast('Inquiry deleted');
      loadStats();
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else loadList();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await api.exportCsv(activeFilters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast('CSV exported');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setExporting(false);
    }
  }

  const refresh = () => { loadList(); loadStats(); };
  const firstName = (admin?.name || 'Admin').split(' ')[0];
  const from = pagination.total ? (pagination.page - 1) * LIMIT + 1 : 0;
  const to = Math.min(pagination.page * LIMIT, pagination.total);
  const maxCat = Math.max(1, ...(stats?.byCategory || []).map((c) => c.count));

  return (
    <div className="dash">
      <header className="dash-top">
        <div className="dash-top-inner">
          <Brand small />
          <div className="dash-top-actions">
            <div className="admin-chip">
              <span className="avatar">{firstName[0]?.toUpperCase()}</span>
              <span className="admin-meta"><b>{admin?.name}</b><small>{admin?.email}</small></span>
            </div>
            <ThemeToggle />
            <button className="btn btn-ghost" onClick={logout}>
              <LogOut size={16} /> <span className="hide-xs">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-title">
          <div>
            <h1>Hello, {firstName} <span className="wave">👋</span></h1>
            <p className="muted">Here's what's happening with your inquiries.</p>
          </div>
          <div className="dash-title-actions">
            <button className="btn btn-ghost" onClick={refresh} aria-label="Refresh">
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> <span className="hide-xs">Refresh</span>
            </button>
            <button className="btn btn-primary" onClick={exportCsv} disabled={exporting || !pagination.total}>
              <Download size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        <section className="stats-grid">
          <StatCard icon={ClipboardList} label="Total inquiries" value={stats?.total} tone="brand" loading={!stats} />
          <StatCard icon={Sparkles} label="New" value={stats?.new} tone="blue" loading={!stats} />
          <StatCard icon={Timer} label="In progress" value={stats?.inProgress} tone="amber" loading={!stats} />
          <StatCard icon={CheckCircle2} label="Resolved" value={stats?.resolved} tone="green" loading={!stats} />
        </section>

        {stats && stats.total > 0 && (
          <section className="panel mix">
            <div className="mix-head">
              <h2>Inquiries by category</h2>
              <span className="trend"><TrendingUp size={14} /> {stats.last7Days} in the last 7 days</span>
            </div>
            <div className="mix-bars">
              {CATEGORIES.map((c, i) => {
                const count = stats.byCategory.find((x) => x.category === c)?.count || 0;
                return (
                  <div className="mix-row" key={c}>
                    <span className="mix-label">{c}</span>
                    <div className="mix-track"><div className={`mix-fill c${i + 1}`} style={{ width: `${(count / maxCat) * 100}%` }} /></div>
                    <span className="mix-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="panel">
          <div className="toolbar">
            <div className="search">
              <Search size={18} />
              <input type="search" placeholder="Search by name or phone..." value={filters.search}
                onChange={setFilter('search')} aria-label="Search by name or phone" />
              {filters.search && (
                <button onClick={() => { setFilters((f) => ({ ...f, search: '' })); setPage(1); }} aria-label="Clear search"><X size={16} /></button>
              )}
            </div>
            <div className="filters">
              <select value={filters.category} onChange={setFilter('category')} aria-label="Filter by category">
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={filters.userType} onChange={setFilter('userType')} aria-label="Filter by user type">
                <option value="">All user types</option>
                {USER_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={filters.status} onChange={setFilter('status')} aria-label="Filter by status">
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {hasFilters && <button className="btn btn-ghost clear" onClick={clearFilters}><X size={14} /> Clear</button>}
            </div>
          </div>

          {error && (
            <div className="alert" role="alert">
              {error} <button className="link" onClick={refresh}>Retry</button>
            </div>
          )}

          {/* Desktop table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Email</th><th>User type</th>
                  <th>Category</th><th>Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && !rows.length
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="skel-row">
                        {Array.from({ length: 7 }).map((__, j) => <td key={j}><span className="skel" /></td>)}
                      </tr>
                    ))
                  : rows.map((r) => (
                      <tr key={r.id} onClick={() => setSelected(r)} tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelected(r)}>
                        <td>
                          <div className="cell-name">
                            <span className="avatar">{r.name[0]?.toUpperCase()}</span>
                            <b>{r.name}</b>
                          </div>
                        </td>
                        <td className="nowrap">{r.phone}</td>
                        <td className="ellipsis" title={r.email}>{r.email}</td>
                        <td>{r.userType}</td>
                        <td><CategoryBadge category={r.category} /></td>
                        <td className="nowrap muted">{formatDate(r.createdAt)}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="card-list">
            {loading && !rows.length
              ? Array.from({ length: 4 }).map((_, i) => <div className="m-card skel-card" key={i}><span className="skel" /><span className="skel w-60" /><span className="skel w-40" /></div>)
              : rows.map((r) => (
                  <button className="m-card" key={r.id} onClick={() => setSelected(r)}>
                    <div className="m-card-top">
                      <div className="cell-name"><span className="avatar">{r.name[0]?.toUpperCase()}</span>
                        <div><b>{r.name}</b><small>{r.userType} • {formatDate(r.createdAt)}</small></div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="m-card-meta">
                      <CategoryBadge category={r.category} />
                      <span>{r.phone}</span>
                    </div>
                    <p className="m-card-msg">{r.message}</p>
                  </button>
                ))}
          </div>

          {!loading && !error && rows.length === 0 && (
            <div className="empty">
              <span className="empty-icon">{hasFilters ? <SearchX size={28} /> : <Inbox size={28} />}</span>
              <h3>{hasFilters ? 'No matching inquiries' : 'No inquiries yet'}</h3>
              <p>{hasFilters ? 'Try changing or clearing your filters.' : 'New submissions from the public form will show up here.'}</p>
              {hasFilters && <button className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>}
            </div>
          )}

          {pagination.total > 0 && (
            <div className="pager">
              <span className="muted">Showing <b>{from}-{to}</b> of <b>{pagination.total}</b></span>
              <div className="pager-btns">
                <button className="icon-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft size={18} />
                </button>
                <span className="page-num">{pagination.page} / {pagination.totalPages}</span>
                <button className="icon-btn" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <InquiryDrawer
        inquiry={selected}
        busy={busy}
        onClose={() => setSelected(null)}
        onStatus={changeStatus}
        onDelete={(i) => setConfirm(i)}
      />

      {confirm && (
        <div className="modal-root" role="alertdialog" aria-modal="true">
          <div className="drawer-backdrop" onClick={() => !busy && setConfirm(null)} />
          <div className="modal glass">
            <h3>Delete this inquiry?</h3>
            <p>The inquiry from <b>{confirm.name}</b> will be permanently removed. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={busy}>Cancel</button>
              <button className="btn btn-danger solid" onClick={doDelete} disabled={busy}>{busy ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

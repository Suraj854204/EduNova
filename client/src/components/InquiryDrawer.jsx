import { useEffect } from 'react';
import { CalendarClock, Mail, Phone, Trash2, X } from 'lucide-react';
import { CATEGORIES, STATUSES, categoryClass, formatDateTime, statusClass } from '../constants';

export function StatusBadge({ status }) {
  return <span className={`badge st-${statusClass(status)}`}><i />{status}</span>;
}
export function CategoryBadge({ category }) {
  return <span className={`badge cat-${categoryClass(category)}`}>{category}</span>;
}

export default function InquiryDrawer({ inquiry, onClose, onStatus, onDelete, busy }) {
  useEffect(() => {
    if (!inquiry) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [inquiry, onClose]);

  if (!inquiry) return null;
  const initials = inquiry.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Inquiry details">
        <header className="drawer-head">
          <div className="avatar lg">{initials}</div>
          <div className="drawer-title">
            <h2>{inquiry.name}</h2>
            <p>{inquiry.userType}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <div className="drawer-body">
          <div className="badge-row">
            <CategoryBadge category={inquiry.category} />
            <StatusBadge status={inquiry.status} />
          </div>

          <div className="info-list">
            <a href={`tel:${inquiry.phone}`}><Phone size={16} /> {inquiry.phone}</a>
            <a href={`mailto:${inquiry.email}`}><Mail size={16} /> {inquiry.email}</a>
            <span><CalendarClock size={16} /> {formatDateTime(inquiry.createdAt)}</span>
          </div>

          <h3 className="section-label">Message</h3>
          <p className="message-box">{inquiry.message}</p>

          <h3 className="section-label">Update status</h3>
          <div className="segmented" role="group" aria-label="Status">
            {STATUSES.map((s) => (
              <button key={s} disabled={busy}
                className={inquiry.status === s ? 'active' : ''}
                onClick={() => inquiry.status !== s && onStatus(inquiry, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <footer className="drawer-foot">
          <a className="btn btn-primary" href={`mailto:${inquiry.email}?subject=Re: your ${encodeURIComponent(inquiry.category)} inquiry`}>
            <Mail size={16} /> Reply by email
          </a>
          <button className="btn btn-danger" onClick={() => onDelete(inquiry)} disabled={busy}>
            <Trash2 size={16} /> Delete
          </button>
        </footer>
      </aside>
    </div>
  );
}

export { CATEGORIES };

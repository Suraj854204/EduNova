export const USER_TYPES = ['Parent', 'Student', 'School'];
export const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
export const STATUSES = ['New', 'In Progress', 'Resolved'];

export const statusClass = (s) => ({ New: 'new', 'In Progress': 'progress', Resolved: 'resolved' }[s] || 'new');
export const categoryClass = (c) =>
  ({ Scholarship: 'c1', Concert: 'c2', Admission: 'c3', 'General Query': 'c4' }[c] || 'c4');

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

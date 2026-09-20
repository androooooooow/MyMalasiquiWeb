export default function AdminPagination({ page, pageSize, total, loading, itemLabel, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => startPage + index);

  return (
    <nav className="admin-pagination" aria-label={`${itemLabel} pages`}>
      <span aria-live="polite">
        {loading ? 'Loading…' : `${first}–${last} of ${total} ${itemLabel} · Page ${page} of ${totalPages}`}
      </span>
      <div>
        <button type="button" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        {visiblePages.map((number) => (
          <button key={number} type="button" aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} disabled={loading || number === page} onClick={() => onPageChange(number)}>{number}</button>
        ))}
        <button type="button" disabled={loading || page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </nav>
  );
}

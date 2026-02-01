import React from 'react';
import './Pagination.css';

const buildPages = (current, last) => {
  if (last <= 1) return [];
  if (last <= 5) {
    return Array.from({ length: last }, (_, idx) => idx + 1);
  }

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) {
    pages.push('ellipsis-start');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < last - 1) {
    pages.push('ellipsis-end');
  }

  pages.push(last);
  return pages;
};

const Pagination = ({ meta, onPageChange }) => {
  if (!meta || !meta.last_page || meta.last_page <= 1) return null;
  const current = Number(meta.current_page || 1);
  const last = Number(meta.last_page || 1);
  const pages = buildPages(current, last);

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(Math.max(1, current - 1))}
        disabled={current <= 1}
      >
        Prev
      </button>

      <div className="pagination-pages">
        {pages.map((page) => {
          if (String(page).startsWith('ellipsis')) {
            return (
              <span key={page} className="pagination-ellipsis">
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              type="button"
              className={`pagination-page ${page === current ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="pagination-btn"
        onClick={() => onPageChange(Math.min(last, current + 1))}
        disabled={current >= last}
      >
        Next
      </button>

      <span className="pagination-meta">
        Page {current} / {last}
      </span>
    </div>
  );
};

export default Pagination;

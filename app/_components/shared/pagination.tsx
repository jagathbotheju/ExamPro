'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  total: number;
  onPage: (p: number) => void;
  compact?: boolean;
}

export function Pagination({ page, total, onPage, compact }: PaginationProps) {
  if (total <= 1) return null;
  return (
    <div className="pagination" style={{ justifyContent: compact ? 'flex-start' : 'flex-end' }}>
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onPage(i + 1)}
        >
          {i + 1}
        </button>
      ))}
      <button className="btn btn-ghost btn-sm" disabled={page >= total} onClick={() => onPage(page + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

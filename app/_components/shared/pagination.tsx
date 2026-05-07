'use client';

import ReactPaginate from 'react-paginate';
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
    <div style={{ justifyContent: compact ? 'flex-start' : 'flex-end' }} className="flex">
      <ReactPaginate
        pageCount={total}
        forcePage={page - 1}
        onPageChange={({ selected }) => onPage(selected + 1)}
        marginPagesDisplayed={1}
        pageRangeDisplayed={3}
        previousLabel={
          <span className="flex items-center gap-1">
            <ChevronLeft size={13} />
            previous
          </span>
        }
        nextLabel={
          <span className="flex items-center gap-1">
            next
            <ChevronRight size={13} />
          </span>
        }
        breakLabel="..."
        containerClassName="pagination"
        pageClassName="pagination-item"
        pageLinkClassName="pagination-link"
        activeClassName="pagination-item--active"
        previousClassName="pagination-item pagination-prev"
        nextClassName="pagination-item pagination-next"
        previousLinkClassName="pagination-link"
        nextLinkClassName="pagination-link"
        breakClassName="pagination-item pagination-break"
        breakLinkClassName="pagination-link"
        disabledClassName="pagination-disabled"
      />
    </div>
  );
}

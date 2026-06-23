import React from "react";
import Link from "next/link";

function getVisiblePages(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("ellipsis");

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) pages.push("ellipsis");

  pages.push(totalPages);

  return pages;
}

type StoryPaginationProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function StoryPagination({ currentPage, totalPages, buildHref }: StoryPaginationProps) {
  const pages = getVisiblePages(currentPage, totalPages);
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav className="story-pagination" aria-label="Phân trang danh sách truyện">
      {currentPage === 1 ? (
        <span aria-disabled="true" className="story-pagination-arrow is-disabled">
          Trước
        </span>
      ) : (
        <Link href={buildHref(previousPage)} className="story-pagination-arrow">
          Trước
        </Link>
      )}

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="story-pagination-ellipsis">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={page === currentPage ? "story-pagination-link is-active" : "story-pagination-link"}
          >
            {page}
          </Link>
        ),
      )}

      {currentPage === totalPages ? (
        <span aria-disabled="true" className="story-pagination-arrow is-disabled">
          Sau
        </span>
      ) : (
        <Link href={buildHref(nextPage)} className="story-pagination-arrow">
          Sau
        </Link>
      )}
    </nav>
  );
}

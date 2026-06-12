"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StoryListControlsProps = {
  query: string;
  hasContent: boolean;
};

export function StoryListControls({ query, hasContent }: StoryListControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalizedSearch = search.trim();

      if (normalizedSearch.length > 0) {
        params.set("q", normalizedSearch);
      } else {
        params.delete("q");
      }

      params.delete("page");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [pathname, router, search, searchParams]);

  const hasContentHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (hasContent) {
      params.delete("hasContent");
    } else {
      params.set("hasContent", "true");
    }

    params.delete("page");
    const next = params.toString();
    return next ? `${pathname}?${next}` : pathname;
  }, [hasContent, pathname, searchParams]);

  return (
    <div className="card section-stack">
      <div className="form-field">
        <label htmlFor="story-search">Tìm kiếm truyện</label>
        <input
          id="story-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nhập tên truyện, tác giả hoặc thể loại..."
        />
      </div>
      <Link href={hasContentHref}>
        {hasContent ? "Bỏ lọc truyện có nội dung đọc" : "Chỉ hiện truyện có nội dung đọc"}
      </Link>
    </div>
  );
}

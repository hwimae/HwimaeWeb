"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { FormField } from "@/components/ui/form-field";

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
      const current = searchParams.toString();
      const next = params.toString();
      const currentUrl = current ? `${pathname}?${current}` : pathname;
      const nextUrl = next ? `${pathname}?${next}` : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl);
      }
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
    <div className="card section-stack story-controls">
      <FormField
        id="story-search"
        label="Tìm kiếm truyện"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Nhập tên truyện, tác giả hoặc thể loại..."
      />
      <Button as={Link} href={hasContentHref} color="primary" variant={hasContent ? "solid" : "flat"}>
        {hasContent ? "Bỏ lọc truyện có nội dung đọc" : "Chỉ hiện truyện có nội dung đọc"}
      </Button>
    </div>
  );
}

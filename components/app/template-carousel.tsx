"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface TemplateItem {
  id: string;
  name: string;
}

interface TemplateCarouselProps {
  templates: TemplateItem[];
  loading?: boolean;
}

export function TemplateCarousel({ templates, loading }: TemplateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [templates, loading]);

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[236px] w-44 shrink-0 animate-pulse rounded-lg border border-[#E8E8E8] bg-[#F4F7F6]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
      >
        <Link
          href="/drafting"
          className="flex w-44 shrink-0 flex-col gap-2"
        >
          <div className="flex h-[216px] w-44 items-center justify-center rounded-lg border border-[#E8E8E8] bg-white transition-colors hover:border-[#66A689]">
            <Plus className="h-6 w-6 text-[#006A3B]" />
          </div>
          <p className="text-center text-base font-medium text-[#868686]">
            Blank Contract
          </p>
        </Link>
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/templates?generate=${template.id}`}
            className="flex w-44 shrink-0 flex-col gap-2"
          >
            <div className="h-[216px] w-44 rounded-lg border border-[#E8E8E8] bg-white bg-gradient-to-b from-[#F4F7F6] to-white transition-colors hover:border-[#66A689]" />
            <p className="truncate text-center text-base font-medium text-[#868686]">
              {template.name}
            </p>
          </Link>
        ))}
      </div>
      {canScrollRight && templates.length > 4 && (
        <button
          type="button"
          onClick={scrollNext}
          className="absolute -right-2 top-[88px] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0px_7px_11px_rgba(51,136,98,0.25)]"
          aria-label="Scroll templates"
        >
          <ChevronRight className="h-6 w-6 text-[#006A3B]" />
        </button>
      )}
    </div>
  );
}

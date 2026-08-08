"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import type { Category, Topic } from "@uro-info/content";
import { cn } from "@uro-info/ui";

import { useFavorites } from "@/lib/use-favorites";
import { useRecent } from "@/lib/use-recent";

export function SidebarNav({
  categories,
  topics,
  onNavigate,
}: {
  categories: Category[];
  topics: Topic[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const favorites = useFavorites();
  const recent = useRecent();

  const byId = new Map(topics.map((t) => [t.id, t]));
  const favoriteTopics = favorites.ids.map((id) => byId.get(id)).filter(Boolean) as Topic[];
  const recentTopics = recent.ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((t) => !favorites.has(t!.id)) as Topic[];

  return (
    <nav className="flex flex-col gap-1 py-4">
      {favoriteTopics.length > 0 && (
        <NavGroup label="Favoritter">
          {favoriteTopics.map((t) => (
            <NavLink
              key={t.id}
              href={`/${t.id}`}
              active={pathname === `/${t.id}`}
              onNavigate={onNavigate}
            >
              <Star className="text-amber h-3 w-3 shrink-0 fill-current" />
              {t.title}
            </NavLink>
          ))}
        </NavGroup>
      )}

      {recentTopics.length > 0 && (
        <NavGroup label="Nylig besøkt">
          {recentTopics.map((t) => (
            <NavLink
              key={t.id}
              href={`/${t.id}`}
              active={pathname === `/${t.id}`}
              onNavigate={onNavigate}
            >
              {t.title}
            </NavLink>
          ))}
        </NavGroup>
      )}

      {categories.map((cat) => {
        const items = topics.filter((t) => t.cat === cat.id);
        if (!items.length) return null;
        return (
          <NavGroup
            key={cat.id}
            label={
              <>
                <span className={cn("swatch", cat.swatch)} />
                {cat.label}
              </>
            }
          >
            {items.map((t) =>
              t.status === "ferdig" ? (
                <NavLink
                  key={t.id}
                  href={`/${t.id}`}
                  active={pathname === `/${t.id}`}
                  onNavigate={onNavigate}
                >
                  {t.title}
                  {favorites.has(t.id) && (
                    <Star className="text-amber h-3 w-3 shrink-0 fill-current" />
                  )}
                </NavLink>
              ) : (
                <span
                  key={t.id}
                  className="text-muted-foreground/60 flex items-center justify-between gap-2 px-4 py-1.5 text-[13.5px]"
                >
                  {t.title}
                  <span className="pill">planlagt</span>
                </span>
              ),
            )}
          </NavGroup>
        );
      })}
    </nav>
  );
}

function NavGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-1 first:mt-0">
      <h3 className="text-muted-foreground mx-4 mb-1.5 mt-4 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider">
        {label}
      </h3>
      <ul className="m-0 list-none p-0">{children}</ul>
    </div>
  );
}

function NavLink({
  href,
  active,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "text-foreground hover:bg-primary-tint flex items-center justify-between gap-2 border-l-[3px] border-transparent px-[15px] py-[7px] text-[13.5px] no-underline",
          active && "border-l-primary bg-primary-tint font-semibold",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

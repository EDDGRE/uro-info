"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import type { Category, Topic } from "@uro-info/content";
import { SURGERY_SUBCAT_LABELS, type SurgerySubcat } from "@uro-info/content/schema";
import { cn } from "@uro-info/ui";

import { useFavorites } from "@/lib/use-favorites";
import { useRecent } from "@/lib/use-recent";

/** Just the fields navigation actually renders — deliberately not the full `Topic`
 * (which carries each topic's full HTML in `indication`/`outro`). Those fields would
 * otherwise get serialized into every page's hydration payload via this "use client"
 * tree, regardless of which page is open, which is exactly the kind of leak the
 * Ahus-password Worker gate (worker/index.ts) is meant to prevent — see
 * apps/web/src/app/layout.tsx, which does the trimming before passing topics down. */
export type NavTopic = Pick<Topic, "id" | "title" | "cat" | "subcat" | "status" | "ahusOnly">;

export function SidebarNav({
  categories,
  topics,
  onNavigate,
}: {
  categories: Category[];
  topics: NavTopic[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const favorites = useFavorites();
  const recent = useRecent();

  const byId = new Map(topics.map((t) => [t.id, t]));
  const favoriteTopics = favorites.ids.map((id) => byId.get(id)).filter(Boolean) as NavTopic[];
  const recentTopics = recent.ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((t) => !favorites.has(t!.id)) as NavTopic[];

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
              ahusOnly={t.ahusOnly}
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
              ahusOnly={t.ahusOnly}
            >
              {t.title}
            </NavLink>
          ))}
        </NavGroup>
      )}

      {categories.map((cat) => {
        const items = topics
          .filter((t) => t.cat === cat.id)
          .sort((a, b) => a.title.localeCompare(b.title, "nb"));
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
            {cat.id === "kirurgi" ? (
              <SurgerySubgroups
                items={items}
                pathname={pathname}
                onNavigate={onNavigate}
                favorites={favorites}
              />
            ) : (
              items.map((t) => <TopicNavItem key={t.id} topic={t} pathname={pathname} onNavigate={onNavigate} favorites={favorites} />)
            )}
          </NavGroup>
        );
      })}
    </nav>
  );
}

function TopicNavItem({
  topic: t,
  pathname,
  onNavigate,
  favorites,
}: {
  topic: NavTopic;
  pathname: string;
  onNavigate?: () => void;
  favorites: ReturnType<typeof useFavorites>;
}) {
  return t.status === "ferdig" ? (
    <NavLink href={`/${t.id}`} active={pathname === `/${t.id}`} onNavigate={onNavigate} ahusOnly={t.ahusOnly}>
      {t.title}
      {favorites.has(t.id) && <Star className="text-amber h-3 w-3 shrink-0 fill-current" />}
    </NavLink>
  ) : (
    <li
      data-ahus-only={t.ahusOnly ? "true" : undefined}
      className="text-muted-foreground/60 flex items-center justify-between gap-2 px-4 py-1.5 text-[13.5px]"
    >
      {t.title}
      <span className="pill">planlagt</span>
    </li>
  );
}

const SURGERY_SUBCAT_ORDER: SurgerySubcat[] = ["robot", "endo", "apen", "andre"];

function SurgerySubgroups({
  items,
  pathname,
  onNavigate,
  favorites,
}: {
  items: NavTopic[];
  pathname: string;
  onNavigate?: () => void;
  favorites: ReturnType<typeof useFavorites>;
}) {
  const grouped = SURGERY_SUBCAT_ORDER.map((subcat) => ({
    subcat,
    items: items.filter((t) => t.subcat === subcat),
  })).filter((g) => g.items.length > 0);
  const ungrouped = items.filter((t) => !t.subcat);

  return (
    <>
      {grouped.map(({ subcat, items: subItems }) => (
        <li key={subcat} className="mt-2.5 first:mt-0">
          <h4 className="text-muted-foreground/80 mx-4 mb-1 text-[10px] font-semibold uppercase tracking-wider">
            {SURGERY_SUBCAT_LABELS[subcat]}
          </h4>
          <ul className="m-0 list-none p-0">
            {subItems.map((t) => (
              <TopicNavItem key={t.id} topic={t} pathname={pathname} onNavigate={onNavigate} favorites={favorites} />
            ))}
          </ul>
        </li>
      ))}
      {ungrouped.map((t) => (
        <TopicNavItem key={t.id} topic={t} pathname={pathname} onNavigate={onNavigate} favorites={favorites} />
      ))}
    </>
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
  ahusOnly,
  children,
}: {
  href: string;
  active: boolean;
  onNavigate?: () => void;
  ahusOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <li data-ahus-only={ahusOnly ? "true" : undefined}>
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

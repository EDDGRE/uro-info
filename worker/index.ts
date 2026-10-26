/**
 * Cloudflare Worker in front of the static Next.js export (served via the `ASSETS`
 * binding, see wrangler.jsonc) — password-gates the whole site behind a single shared
 * password. Unlike Cloudflare Access it never redirects to a third-party login page,
 * which is what makes it work cleanly as an iOS "Add to Home Screen" PWA: log in once,
 * get a long-lived signed cookie, and the app opens straight in afterwards.
 *
 * On top of that, a second, narrower password gates Ahus-internal content specifically
 * (the content tagged `data-ahus-only` / `.callout.internal` in the HTML, and entries
 * flagged `ahusOnly` in the search index). Without the second cookie, this Worker
 * strips that content out of every HTML response with HTMLRewriter and filters it out
 * of search-index.json, so it is genuinely absent from what's sent to the browser —
 * not just hidden with CSS, the way the reader-preference toggle (`data-show-ahus`,
 * see use-ahus-visibility.ts) works once content *is* unlocked.
 *
 * Required environment variables (set as *encrypted* secrets in the Cloudflare
 * dashboard, or via `wrangler secret put` — never commit these):
 *   SITE_PASSWORD  the shared password for the whole site
 *   AHUS_PASSWORD  the narrower password that unlocks Ahus-internal content
 *   AUTH_SECRET    random string used to sign both auth cookies
 */

export interface Env {
  ASSETS: Fetcher;
  SITE_PASSWORD: string;
  AHUS_PASSWORD: string;
  AUTH_SECRET: string;
}

const COOKIE_NAME = "uro_auth";
const AHUS_COOKIE_NAME = "uro_ahus_auth";
const SESSION_SECONDS = 60 * 60 * 24 * 182; // ~6 months
const AUTH_PATH = "/_auth";
const AHUS_AUTH_PATH = "/_auth_ahus";

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function makeToken(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${await hmac(payload, secret)}`;
}

async function isValidToken(token: string, secret: string): Promise<boolean> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (signature !== (await hmac(payload, secret))) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function loginPage(options: { error?: boolean; redirectTo: string }): Response {
  const html = `<!doctype html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Uro Info — Logg inn</title>
<style>
  :root{color-scheme:dark;}
  *{box-sizing:border-box;}
  html,body{margin:0;height:100%;}
  body{
    display:flex; align-items:center; justify-content:center; min-height:100%;
    background:#12161d; color:#e7e9ec;
    font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
    padding:24px;
  }
  form{
    width:100%; max-width:340px; background:#191f28; border:1px solid #2a323e;
    border-radius:10px; padding:28px 26px;
  }
  h1{font-size:18px; margin:0 0 6px; color:#fff;}
  p.sub{font-size:13px; color:#97a2b0; margin:0 0 20px;}
  label{display:block; font-size:12px; color:#97a2b0; margin-bottom:6px;}
  input[type=password]{
    width:100%; padding:10px 12px; border-radius:6px; border:1px solid #2a323e;
    background:#12161d; color:#e7e9ec; font-size:16px; margin-bottom:14px;
  }
  input[type=password]:focus{outline:2px solid #6f9bc7; border-color:transparent;}
  button{
    width:100%; padding:10px 12px; border-radius:6px; border:none;
    background:#2c4a6e; color:#fff; font-size:14px; font-weight:600; cursor:pointer;
  }
  button:hover{background:#345a85;}
  .error{color:#e08277; font-size:13px; margin:0 0 14px;}
</style>
</head>
<body>
  <form method="POST" action="${AUTH_PATH}">
    <h1>Uro Info</h1>
    <p class="sub">Klinisk oppslagsverk — passordbeskyttet</p>
    ${options.error ? '<p class="error">Feil passord — prøv igjen.</p>' : ""}
    <input type="hidden" name="redirect" value="${options.redirectTo.replace(/"/g, "&quot;")}">
    <label for="password">Passord</label>
    <input type="password" id="password" name="password" autofocus autocomplete="current-password" required>
    <button type="submit">Logg inn</button>
  </form>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Marks the page as Ahus-unlocked so client-side JS (use-ahus-visibility.ts) knows the
 * content is actually present and the reader-preference toggle has something to show. */
function markAhusUnlocked(response: Response): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;
  return new HTMLRewriter()
    .on("html", {
      element(el) {
        el.setAttribute("data-ahus-unlocked", "true");
      },
    })
    .transform(response);
}

interface Span {
  start: number;
  end: number;
}

const NEXT_F_PUSH_RE = /<script>self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)<\/script>/g;

function utf8Length(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** Walks forward from `start` counting UTF-8 bytes per Unicode code point, to find the
 * character offset exactly `byteCount` bytes later (React Flight's `T` rows declare
 * payload length in bytes, not characters). */
function findByteOffset(text: string, start: number, byteCount: number): number {
  let bytes = 0;
  let i = start;
  for (const ch of text.slice(start)) {
    const chBytes = utf8Length(ch);
    if (bytes + chBytes > byteCount) break;
    bytes += chBytes;
    i += ch.length;
    if (bytes >= byteCount) break;
  }
  return i;
}

/** Finds every `<div ...marker...>...</div>` span in `text` (depth-tracked so nested
 * divs inside it don't break the match) and appends it to `out`. Bails out (stops
 * scanning further, keeps the rest untouched) rather than risk mangling malformed input. */
function findDivSpans(text: string, marker: string, out: Span[]): void {
  let pos = 0;
  for (;;) {
    const markerAt = text.indexOf(marker, pos);
    if (markerAt === -1) return;
    const start = text.lastIndexOf("<div", markerAt);
    if (start === -1 || start < pos) {
      pos = markerAt + marker.length;
      continue;
    }

    let depth = 0;
    let i = start;
    let end = -1;
    while (i < text.length) {
      const nextOpen = text.indexOf("<div", i);
      const nextClose = text.indexOf("</div>", i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 4;
      } else {
        depth -= 1;
        i = nextClose + 6;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) return;
    out.push({ start, end });
    pos = end;
  }
}

/** Sorts spans and merges any that overlap or are nested into their union, so a removal
 * span is never counted or deleted twice (e.g. a `callout internal` box nested inside an
 * already-matched `data-ahus-only` wrapper). */
function mergeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: Span[] = [];
  for (const s of sorted) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) {
      last.end = Math.max(last.end, s.end);
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/** Re-escapes `<`/`>` the way Next's own flight serializer does, so the result is safe
 * to embed inside a `<script>` tag (in particular so it can never contain a literal
 * `</script` sequence that would close the tag early). */
function encodeFlightChunk(s: string): string {
  return JSON.stringify(s).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

/** Forward-scans `text` to find the end of the JSON object/array opened at `openIndex`,
 * honoring string literals (so a brace inside a quoted value doesn't affect depth). */
function findJsonContainerEnd(text: string, openIndex: number): number {
  const openChar = text[openIndex];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === openChar) depth += 1;
    else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/** Extends [start, end) to also swallow one adjacent comma (preferring the trailing
 * one), so deleting that span from a JSON array/object leaves valid JSON behind. */
function spanWithAdjacentComma(text: string, start: number, end: number): Span {
  if (text[end] === ",") return { start, end: end + 1 };
  let b = start - 1;
  while (b >= 0 && /\s/.test(text[b])) b -= 1;
  if (text[b] === ",") return { start: b, end };
  return { start, end };
}

/**
 * Not every Ahus-only element reaches the flight payload as raw HTML text (which
 * `findDivSpans` covers) — the global nav's `<li data-ahus-only>` and the dashboard's
 * topic cards compute that attribute client-side from each topic's plain `ahusOnly`
 * JSON field, which still says `true` in the payload even after HTMLRewriter removes
 * the corresponding element from the DOM. React's hydration then expects to find an
 * element the server's actual HTML no longer has, and throws. This finds the
 * *enclosing* JSON object for every literal `"ahusOnly":true` in `text` — whatever
 * shape that object is (nav topic, dashboard card, …) — and appends its span (plus one
 * adjacent comma, so the array it sits in stays valid) to `out`, so the topic is
 * removed from the data entirely, matching its absence from the DOM.
 */
function findAhusOnlyObjectSpans(text: string, out: Span[]): void {
  const marker = '"ahusOnly":true';
  const stack: number[] = [];
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    if (inString) {
      const ch = text[i];
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (text.startsWith(marker, i)) {
      const objStart = stack[stack.length - 1];
      if (objStart !== undefined && text[objStart] === "{") {
        const objEnd = findJsonContainerEnd(text, objStart);
        if (objEnd !== -1) out.push(spanWithAdjacentComma(text, objStart, objEnd));
      }
    }
    const ch = text[i];
    if (ch === '"') {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(i);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
    }
  }
}

/**
 * The dashboard (`apps/web/src/app/page.tsx`) is a *server* component — unlike the nav,
 * there's no client-side re-render that can skip a topic once its data is gone; the
 * `<div data-ahus-only="true">` card is already baked into the payload as a fixed React
 * element (`["$","div",key,{"data-ahus-only":"true",...}]`), not as raw data a client
 * component reconstructs. Finds every element whose props object contains
 * `propsMarker` and appends that *element's* full span (one level up from the props
 * object itself) to `out`, so the element is dropped from its parent's children array
 * entirely.
 */
function findMarkedElementSpans(text: string, propsMarker: string, out: Span[]): void {
  const stack: number[] = [];
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    if (inString) {
      const ch = text[i];
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (text.startsWith(propsMarker, i)) {
      const propsStart = stack[stack.length - 1];
      const elementStart = stack[stack.length - 2];
      if (
        propsStart !== undefined &&
        text[propsStart] === "{" &&
        elementStart !== undefined &&
        text[elementStart] === "["
      ) {
        const elementEnd = findJsonContainerEnd(text, elementStart);
        if (elementEnd !== -1) out.push(spanWithAdjacentComma(text, elementStart, elementEnd));
      }
    }
    const ch = text[i];
    if (ch === '"') {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(i);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
    }
  }
}

/**
 * React Flight "outlines" a subtree that's referenced from elsewhere into its own
 * numbered row (`<id>:[...]`), pointed at by a `"$L<id>"` token in place of an inline
 * element — the dashboard's per-category `<section>` is outlined this way. When every
 * card in a section is Ahus-only, the section collapses to nothing once each card is
 * removed (matching `if (!items.length) return null` — what the real per-request render
 * would have produced), so the row itself must be dropped too, along with the
 * `"$L<id>"` reference to it wherever the parent lists it as a child — otherwise the
 * client tries to resolve a row that no longer exists.
 */
function findAhusOnlySectionRowSpans(text: string, out: Span[]): void {
  for (const m of text.matchAll(/(^|\n)([0-9a-f]+):\["\$","section",/g)) {
    const id = m[2];
    const rowStart = (m.index ?? 0) + m[1].length;
    const arrStart = rowStart + id.length + 1;
    const rowEnd = findJsonContainerEnd(text, arrStart);
    if (rowEnd === -1) continue;
    const rowText = text.slice(arrStart, rowEnd);
    const cardCount = (rowText.match(/"className":"home-card/g) ?? []).length;
    const ahusCardCount = (rowText.match(/"data-ahus-only":"true"/g) ?? []).length;
    if (cardCount === 0 || cardCount !== ahusCardCount) continue;

    const end = text[rowEnd] === "\n" ? rowEnd + 1 : rowEnd;
    out.push({ start: rowStart, end });

    const refMarker = `"$L${id}"`;
    let refAt = text.indexOf(refMarker);
    while (refAt !== -1) {
      out.push(spanWithAdjacentComma(text, refAt, refAt + refMarker.length));
      refAt = text.indexOf(refMarker, refAt + refMarker.length);
    }
  }
}

/**
 * Removing a topic's `<li data-ahus-only>` nav entry can leave its whole category group
 * (`SidebarNav`'s `NavGroup` — a `<div class="mb-1 first:mt-0">` wrapping an `<h3>`
 * heading and the now-empty `<ul>`) behind as a dangling, childless heading in the DOM —
 * e.g. the "admin" category here has exactly one topic, the Ahus-only
 * `henvisningsvurdering`. `SidebarNav` itself (`if (!items.length) return null`) already
 * skips rendering that whole group client-side once the topic is gone from the payload
 * (see `findAhusOnlyObjectSpans`), so without this the DOM would still show the heading
 * while React's hydration expects nothing there at all. Removes the entire wrapper for
 * any `NavGroup` whose `<ul>` ends up empty after the `[data-ahus-only]` DOM removal.
 */
function removeEmptyNavGroups(html: string): string {
  const openDiv = '<div class="mb-1 first:mt-0">';
  const emptyUl = '<ul class="m-0 list-none p-0"></ul>';
  let result = "";
  let pos = 0;
  for (;;) {
    const ulAt = html.indexOf(emptyUl, pos);
    if (ulAt === -1) {
      result += html.slice(pos);
      return result;
    }
    const divStart = html.lastIndexOf(openDiv, ulAt);
    const closeAt = html.indexOf("</div>", ulAt);
    if (divStart === -1 || divStart < pos || closeAt === -1) {
      result += html.slice(pos, ulAt + emptyUl.length);
      pos = ulAt + emptyUl.length;
      continue;
    }
    result += html.slice(pos, divStart);
    pos = closeAt + 6;
  }
}

/**
 * Mirrors `removeEmptyNavGroups` for the dashboard (`apps/web/src/app/page.tsx`): once
 * HTMLRewriter removes an Ahus-only `<div class="home-card">`, a category whose only
 * topic was that one is left as a dangling `<section class="mb-8">` wrapping just an
 * `<h2>` heading and an empty `<div class="home-grid"></div>` — exactly the element
 * `findAhusOnlySectionRowSpans` already drops from the flight payload (since
 * `if (!items.length) return null` means the real per-request render would skip it
 * entirely). Removes the whole wrapper for any such now-empty section.
 */
function removeEmptyHomeSections(html: string): string {
  const openSection = '<section class="mb-8">';
  const emptyGrid = '<div class="home-grid"></div>';
  let result = "";
  let pos = 0;
  for (;;) {
    const gridAt = html.indexOf(emptyGrid, pos);
    if (gridAt === -1) {
      result += html.slice(pos);
      return result;
    }
    const sectionStart = html.lastIndexOf(openSection, gridAt);
    const closeAt = html.indexOf("</section>", gridAt);
    if (sectionStart === -1 || sectionStart < pos || closeAt === -1) {
      result += html.slice(pos, gridAt + emptyGrid.length);
      pos = gridAt + emptyGrid.length;
      continue;
    }
    result += html.slice(pos, sectionStart);
    pos = closeAt + "</section>".length;
  }
}

/**
 * Next.js's static export embeds a full second copy of each page's content inside
 * `<script>self.__next_f.push([1,"..."])</script>` tags — the React Flight payload used
 * for hydration. HTMLRewriter only sees the real DOM, not text inside a script, so
 * without this pass that copy would still leak the full Ahus-internal content to anyone
 * reading page source, even with the markup stripped from the DOM.
 *
 * Some rows in that payload are framed with an explicit UTF-8 byte length
 * (`<id>:T<hexlen>,<exactly hexlen bytes>`, which Next uses for large HTML strings to
 * avoid double-escaping overhead). Naively deleting text from inside one of those
 * without updating its declared length desyncs the stream from its own framing — the
 * client's flight reader tries to read bytes that no longer exist and hydration crashes
 * outright (`Connection closed`, minified React error #418), rather than just leaking
 * content. So this decodes every push() call back into the real flight stream text,
 * removes the Ahus-only spans, recomputes each affected `T` row's byte length, and
 * re-encodes everything into one consolidated push() call in place of the originals.
 */
function fixAhusFlightPayload(html: string): string {
  const matches = [...html.matchAll(NEXT_F_PUSH_RE)];
  if (matches.length === 0) return html;

  const fullStream = matches.map((m) => JSON.parse(m[1]) as string).join("");

  const rawSpans: Span[] = [];
  findDivSpans(fullStream, 'data-ahus-only="true"', rawSpans);
  findDivSpans(fullStream, 'class="callout internal"', rawSpans);
  findAhusOnlyObjectSpans(fullStream, rawSpans);
  findAhusOnlySectionRowSpans(fullStream, rawSpans);
  findMarkedElementSpans(fullStream, '"data-ahus-only":"true"', rawSpans);
  const removals = mergeSpans(rawSpans);
  if (removals.length === 0) return html;

  const tRows: Array<{
    hexStart: number;
    hexEnd: number;
    payloadStart: number;
    payloadEnd: number;
    declaredBytes: number;
  }> = [];
  for (const m of fullStream.matchAll(/(^|\n)(\d+):T([0-9a-f]+),/g)) {
    const matchStart = m.index ?? 0;
    const hexStart = matchStart + m[1].length + m[2].length + 2; // skip prefix + id + ":T"
    const hexEnd = hexStart + m[3].length;
    const payloadStart = matchStart + m[0].length;
    const declaredBytes = parseInt(m[3], 16);
    const payloadEnd = findByteOffset(fullStream, payloadStart, declaredBytes);
    tRows.push({ hexStart, hexEnd, payloadStart, payloadEnd, declaredBytes });
  }

  const edits: Array<{ start: number; end: number; replacement: string }> = removals.map((r) => ({
    start: r.start,
    end: r.end,
    replacement: "",
  }));
  for (const row of tRows) {
    let removedBytes = 0;
    for (const r of removals) {
      if (r.start >= row.payloadStart && r.end <= row.payloadEnd) {
        removedBytes += utf8Length(fullStream.slice(r.start, r.end));
      }
    }
    if (removedBytes > 0) {
      edits.push({
        start: row.hexStart,
        end: row.hexEnd,
        replacement: (row.declaredBytes - removedBytes).toString(16),
      });
    }
  }
  edits.sort((a, b) => a.start - b.start);

  let fixedStream = "";
  let cursor = 0;
  for (const e of edits) {
    fixedStream += fullStream.slice(cursor, e.start);
    fixedStream += e.replacement;
    cursor = e.end;
  }
  fixedStream += fullStream.slice(cursor);

  const combinedTag = `<script>self.__next_f.push([1,${encodeFlightChunk(fixedStream)}])</script>`;
  let result = "";
  let lastIndex = 0;
  let wroteCombined = false;
  for (const m of matches) {
    const mStart = m.index ?? 0;
    result += html.slice(lastIndex, mStart);
    if (!wroteCombined) {
      result += combinedTag;
      wroteCombined = true;
    }
    lastIndex = mStart + m[0].length;
  }
  result += html.slice(lastIndex);
  return result;
}

/** Removes every element tagged as Ahus-internal from an HTML response, and filters
 * Ahus-only entries out of the prebuilt search index — so the content is genuinely
 * absent from the response, not just hidden client-side. */
async function stripAhusContent(response: Response, pathname: string): Promise<Response> {
  const contentType = response.headers.get("content-type") ?? "";

  if (pathname === "/search-index.json" || contentType.includes("application/json")) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return response;
    }
    // Drops whole-topic `ahusOnly` entries, and — since a search entry is one section's
    // worth of text and the index doesn't track individual callout boxes within it —
    // also drops any entry whose body happens to mention "Ahus internt" at all, even in
    // topics that are otherwise general. A section search snippet is coarser than the
    // page-level stripping above, so this errs on the side of dropping too much rather
    // than risk a locked box's text surfacing in search results.
    const filtered = Array.isArray(data)
      ? data.filter((entry) => {
          if (!entry || typeof entry !== "object") return true;
          if ("ahusOnly" in entry && entry.ahusOnly) return false;
          const text =
            "bodyText" in entry && typeof entry.bodyText === "string" ? entry.bodyText : "";
          return !/ahus intern/i.test(text);
        })
      : data;
    return new Response(JSON.stringify(filtered), {
      status: response.status,
      headers: response.headers,
    });
  }

  if (!contentType.includes("text/html")) return response;

  const rewritten = new HTMLRewriter()
    .on("[data-ahus-only]", {
      element(el) {
        el.remove();
      },
    })
    .on(".callout.internal", {
      element(el) {
        el.remove();
      },
    })
    .transform(response);

  const domText = removeEmptyHomeSections(removeEmptyNavGroups(await rewritten.text()));
  const html = fixAhusFlightPayload(domText);
  const headers = new Headers(rewritten.headers);
  headers.delete("content-length");
  return new Response(html, { status: rewritten.status, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === AUTH_PATH && request.method === "POST") {
      const form = await request.formData();
      const password = form.get("password");
      const redirectTo = form.get("redirect")?.toString() || "/";

      if (password === env.SITE_PASSWORD) {
        const token = await makeToken(env.AUTH_SECRET);
        return new Response(null, {
          status: 303,
          headers: {
            Location: redirectTo,
            "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
          },
        });
      }
      return loginPage({ error: true, redirectTo });
    }

    const cookie = readCookie(request, COOKIE_NAME);
    const siteAuthed = !!cookie && (await isValidToken(cookie, env.AUTH_SECRET));

    if (url.pathname === AHUS_AUTH_PATH && request.method === "POST") {
      if (!siteAuthed) return new Response("Unauthorized", { status: 401 });
      let password: unknown;
      try {
        const body = (await request.json()) as { password?: unknown };
        password = body.password;
      } catch {
        // malformed body — falls through to the wrong-password response below
      }
      if (typeof password === "string" && password === env.AHUS_PASSWORD) {
        const token = await makeToken(env.AUTH_SECRET);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "Set-Cookie": `${AHUS_COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
          },
        });
      }
      return new Response(JSON.stringify({ ok: false }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    if (!siteAuthed) {
      return loginPage({ redirectTo: url.pathname + url.search });
    }

    const ahusCookie = readCookie(request, AHUS_COOKIE_NAME);
    const ahusAuthed = !!ahusCookie && (await isValidToken(ahusCookie, env.AUTH_SECRET));

    const assetResponse = await env.ASSETS.fetch(request);
    return ahusAuthed
      ? markAhusUnlocked(assetResponse)
      : stripAhusContent(assetResponse, url.pathname);
  },
} satisfies ExportedHandler<Env>;

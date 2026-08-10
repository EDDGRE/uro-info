/**
 * Cloudflare Worker in front of the static Next.js export (served via the `ASSETS`
 * binding, see wrangler.jsonc) — password-gates the whole site behind a single shared
 * password. Unlike Cloudflare Access it never redirects to a third-party login page,
 * which is what makes it work cleanly as an iOS "Add to Home Screen" PWA: log in once,
 * get a long-lived signed cookie, and the app opens straight in afterwards.
 *
 * Required environment variables (set as *encrypted* secrets in the Cloudflare
 * dashboard, or via `wrangler secret put` — never commit these):
 *   SITE_PASSWORD  the shared password
 *   AUTH_SECRET    random string used to sign the auth cookie
 */

export interface Env {
  ASSETS: Fetcher;
  SITE_PASSWORD: string;
  AUTH_SECRET: string;
}

const COOKIE_NAME = "uro_auth";
const SESSION_SECONDS = 60 * 60 * 24 * 182; // ~6 months
const AUTH_PATH = "/_auth";

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
    if (cookie && (await isValidToken(cookie, env.AUTH_SECRET))) {
      return env.ASSETS.fetch(request);
    }

    return loginPage({ redirectTo: url.pathname + url.search });
  },
} satisfies ExportedHandler<Env>;

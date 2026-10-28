// Password lock for NDA case studies.
//
// Everything under the paths listed in netlify.toml (the page and its images)
// is only sent once the visitor has entered the password. The password lives
// in Netlify, never in this code:
//   Site configuration › Environment variables › CASE_STUDY_PASSWORD
//
// A correct password sets a signed cookie for 7 days, so visitors only
// enter it once per browser.

import type { Context } from "https://edge.netlify.com";

const COOKIE = "hmj_case_study";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async (request: Request, context: Context) => {
  const password = Netlify.env.get("CASE_STUDY_PASSWORD");

  // Fail closed: never serve the page if no password has been set up
  if (!password) {
    return page(
      "This case study isn't available yet",
      "The password hasn't been set up. Please check back soon.",
      { status: 503, form: false },
    );
  }

  const url = new URL(request.url);
  const token = await sign(password);

  // Log out: clear the cookie and show the lock page again
  if (url.searchParams.has("logout")) {
    return new Response(null, {
      status: 303,
      headers: {
        Location: url.pathname,
        "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  // Password submitted
  if (request.method === "POST") {
    const form = await request.formData();
    const attempt = String(form.get("password") ?? "");

    if (await safeEqual(await sign(attempt), token)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: url.pathname,
          "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
          "Cache-Control": "no-store",
        },
      });
    }

    return page(
      "This case study is protected",
      "That password didn't work. Check it and try again, or email me for access.",
      { status: 401, error: true },
    );
  }

  // Already unlocked: serve the real page or image
  const cookie = context.cookies.get(COOKIE);
  if (cookie && (await safeEqual(cookie, token))) {
    const response = await context.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  // Images and other files under the lock just get a plain refusal
  const accept = request.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) {
    return new Response("Locked", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  return page(
    "This case study is protected",
    "This project is under NDA. Enter the password to view it, or email me for access.",
    { status: 401 },
  );
};

// HMAC of a fixed message keyed by the password: the cookie proves the visitor
// knew the password without the password itself ever being stored in it.
async function sign(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("hmj-case-study-v1"));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compare without leaking how many characters matched
async function safeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function page(
  title: string,
  message: string,
  opts: { status: number; form?: boolean; error?: boolean },
): Response {
  const form = opts.form !== false;
  const html = `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Protected case study — Huw Maitland-Jones</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <script src="/script.js" defer></script>
</head>
<body class="lock-page">
  <header class="nav">
    <div class="container nav__inner">
      <a href="/" class="logo" aria-label="Huw Maitland-Jones, home">
        <img src="/assets/logo-mark.png" alt="" width="21" height="40">
      </a>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Open menu">
        <span class="nav__toggle-bar"></span>
        <span class="nav__toggle-bar"></span>
      </button>
      <nav aria-label="Main">
        <ul class="nav__links" id="site-menu">
          <li><a href="/#portfolio">Portfolio</a></li>
          <li><a href="/#about">About</a></li>
          <li><a href="/#contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="lock">
    <div class="container lock__inner">
      <svg class="lock__icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="4" y="10.5" width="16" height="10.5" rx="2.5"/>
        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>
      </svg>
      <h1 class="h2 h2--center">${title}</h1>
      <p class="body body--center lock__message${opts.error ? " lock__message--error" : ""}" ${opts.error ? 'role="alert"' : ""}>${message}</p>
      ${form ? `
      <form class="lock__form" method="post">
        <label class="lock__label" for="password">Password</label>
        <div class="lock__row">
          <input class="lock__input" id="password" name="password" type="password" autocomplete="current-password" required autofocus>
          <button class="button lock__button" type="submit">View case study</button>
        </div>
      </form>` : ""}
      <p class="small">Need access? Email <a href="mailto:huwmandesign@gmail.com" class="link">huwmandesign@gmail.com</a></p>
    </div>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: opts.status,
    headers: { "content-type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

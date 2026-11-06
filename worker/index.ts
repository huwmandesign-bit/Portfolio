// Cloudflare Worker for huwmandesign.com.
// Static files (the whole site) are served by Cloudflare's asset handler.
// Only the locked case study paths reach this code (see wrangler.jsonc).

import { lock } from "./lock";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  CASE_STUDY_PASSWORD?: string;
}

const LOCKED = [/^\/apple-pay-deposits(\/|$)/, /^\/assets\/apple-pay-deposits\//];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (LOCKED.some((re) => re.test(pathname))) {
      return lock(request, env, () => env.ASSETS.fetch(request));
    }
    return env.ASSETS.fetch(request);
  },
};

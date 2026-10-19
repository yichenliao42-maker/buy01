declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare { interface Env { ACCESS_TEAM_DOMAIN?:string;ACCESS_AUD?:string; } }

declare namespace Cloudflare { interface Env { ASSETS?:Fetcher; } }

const isDev = process.env.NODE_ENV !== "production";

// Stripe's card form needs its own script, iframes and API; Google profile
// photos come from lh3.googleusercontent.com. Everything else is same-origin.
// 'unsafe-inline' stays for scripts/styles because Next injects inline
// bootstrap scripts and Tailwind/Next inline styles; a nonce-based CSP would
// tighten this further. 'unsafe-eval' is only for the dev server's hot reload.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.stripe.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://m.stripe.network https://r.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;

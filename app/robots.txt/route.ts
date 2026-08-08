const privateRouteRules = `Disallow: /account
Disallow: /admin
Disallow: /api/
Disallow: /login
Disallow: /messages
Disallow: /notebook
Disallow: /notifications
Disallow: /onboarding
Disallow: /portfolio
Disallow: /watchlist
Disallow: /workspace`;

const robots = `User-agent: OAI-SearchBot
Allow: /
${privateRouteRules}

User-agent: *
Allow: /
${privateRouteRules}

Sitemap: https://learnwhatyouown.com/sitemap.xml
`;

export async function GET() {
  return new Response(robots, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

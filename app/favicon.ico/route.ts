const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#17221c"/>
  <path d="M14 18h7l6 27h-7L14 18Zm15 0h7l6 27h-7l-6-27Zm15 0h7l-6 27h-7l6-27Z" fill="#d8b56b"/>
</svg>`;

export async function GET() {
  return new Response(favicon, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800",
    },
  });
}

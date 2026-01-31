/**
 * Cloudflare Worker for EZCTO dynamic subdomain routing
 * 
 * Route: *.ezcto.fun/*
 * 
 * This worker handles requests to {slug}.ezcto.fun and serves files from R2 bucket:
 * - https://{slug}.ezcto.fun/ → R2: {slug}/index.html
 * - https://{slug}.ezcto.fun/assets/logo.png → R2: {slug}/assets/logo.png
 * 
 * Environment bindings required:
 * - SLUG_MAP (KV Namespace): Stores slug → slug mappings for validation
 * - SITES (R2 Bucket): Stores all website files
 */

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // Extract subdomain (slug) from hostname
      // Example: "openclaw-1vj8.ezcto.fun" → "openclaw-1vj8"
      const hostname = url.hostname;
      const parts = hostname.split('.');
      
      // Handle root domain (ezcto.fun) - redirect to main app
      if (parts.length === 2) {
        return Response.redirect('https://www.ezcto.fun', 301);
      }
      
      // Extract slug (first part of subdomain)
      const slug = parts[0];
      
      // Check if slug exists in KV (optional validation)
      // const slugExists = await env.SLUG_MAP.get(`slug:${slug}`);
      // if (!slugExists) {
      //   return new Response('Site not found', { status: 404 });
      // }
      
      // Construct R2 key from slug and path
      // "/" → "{slug}/index.html"
      // "/assets/logo.png" → "{slug}/assets/logo.png"
      let path = url.pathname;
      if (path === '/' || path === '') {
        path = '/index.html';
      }
      
      const r2Key = `${slug}${path}`;
      
      console.log(`[Worker] Fetching R2 key: ${r2Key}`);
      
      // Fetch file from R2
      const object = await env.SITES.get(r2Key);
      
      if (!object) {
        return new Response(`File not found: ${r2Key}`, { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      // Determine content type from file extension
      const contentType = getContentType(path);
      
      // Return file with appropriate headers
      return new Response(object.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
      
    } catch (error) {
      console.error('[Worker] Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};

/**
 * Get content type from file extension
 */
function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  
  const contentTypes = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

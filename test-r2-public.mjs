// Test R2 public URL accessibility
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
console.log('CLOUDFLARE_R2_PUBLIC_URL:', publicUrl);

if (!publicUrl) {
  console.error('ERROR: CLOUDFLARE_R2_PUBLIC_URL not set');
  process.exit(1);
}

// Test access to a known file
const testUrl = publicUrl + '/openclaw-0r87/assets/logo-7761da41.png';
console.log('Testing URL:', testUrl);

try {
  const res = await fetch(testUrl, { method: 'HEAD' });
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  if (res.ok) {
    console.log('SUCCESS: R2 public URL is accessible!');
  } else {
    console.error('ERROR: Got status', res.status);
    process.exit(1);
  }
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}

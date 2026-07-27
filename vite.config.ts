import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default () => {
  const env = loadEnv('all', process.cwd());

  // Optional: route newly-added endpoints (not yet on the deployed prod API) to a
  // locally-running API. Set VITE_LOCAL_API_URL=http://localhost:3000 in .env and
  // run smalsuolis-api locally to test features like /addresses/suggest without
  // deploying. When unset, everything proxies to VITE_PROXY_URL (prod) as before.
  const localApi = env.VITE_LOCAL_API_URL;

  const proxy: Record<string, any> = {};

  // NOTE: Vite matches proxy entries by prefix in insertion order, so the more
  // specific local-API rule must be registered BEFORE the catch-all '/api/'.
  if (localApi) {
    proxy['/api/addresses'] = {
      target: localApi,
      changeOrigin: true,
      // Keep the leading slash: the local API serves /addresses/suggest, and a
      // path without it is read as a service name (addresses.suggest).
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    };
    // Only the NEW /events/near endpoint goes to the local API (it doesn't exist
    // on prod yet). Everything else under /events (the homepage/events list,
    // event detail pages) keeps hitting prod, so the app never depends on the
    // local API / dev-DB tunnel being up. Tradeoff: opening a nearby-popup event
    // whose id only exists in the dev DB will 404 on prod — acceptable while
    // testing; it resolves once the API is deployed.
    proxy['/api/events/near'] = {
      target: localApi,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    };
  }

  proxy['open'] = '/';
  proxy['/api/'] = {
    target: env.VITE_PROXY_URL,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\//, ''),
  };

  return defineConfig({
    plugins: [react()],
    server: { proxy },
    assetsInclude: ['**/*.png'],
  });
};

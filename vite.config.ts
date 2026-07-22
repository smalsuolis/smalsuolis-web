import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default () => {
  const env = loadEnv('all', process.cwd());

  // Optional: route newly-added endpoints (not yet on the deployed prod API) to a
  // locally-running API. Set VITE_LOCAL_API_URL=http://localhost:3000 in .env and
  // run smalsuolis-api locally to test features like /addresses/suggest without
  // deploying. When unset, everything proxies to VITE_PROXY_URL (prod) as before.
  const localApi = env.VITE_LOCAL_API_URL;

  const proxy: Record<string, any> = {
    open: '/',
    '/api/': {
      target: env.VITE_PROXY_URL,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\//, ''),
    },
  };

  if (localApi) {
    proxy['/api/addresses/'] = {
      target: localApi,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api\//, ''),
    };
  }

  return defineConfig({
    plugins: [react()],
    server: { proxy },
    assetsInclude: ['**/*.png'],
  });
};

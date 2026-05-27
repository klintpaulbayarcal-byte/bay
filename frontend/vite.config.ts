import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost/bay',
                changeOrigin: true,
                rewrite: (path) => {
                    if (path === '/api/login') {
                        return '/auth_api.php'
                    }

                    return path.replace(/^\/api/, '')
                }
            },
            '/bay': {
                target: 'http://localhost',
                changeOrigin: true
            }
        }
    }
    ,
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    }
})

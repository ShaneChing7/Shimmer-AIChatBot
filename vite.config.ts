import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // 环境变量获取
    const env = loadEnv(mode, process.cwd())
    
    return {
        plugins: [
            vue(),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        // 代理服务器
        server: {
            port: 5173, // 建议显式指定端口，防止随机端口导致跨域配置失效
            proxy: {
                // 1. API 代理 (保留你原来的配置)
                // 匹配所有以 /api 开头的请求 -> 转发到后端
                [env.VITE_APP_BASE_API]: {
                    target: env.VITE_SERVE,
                    changeOrigin: true,
                    // rewrite: (path) => path.replace(/^\/api/, ''), // (可选) 如果后端接口不包含 /api 前缀，需要开启这一行
                },
                
                // 2. 关键新增：媒体文件代理
                // 匹配所有以 /media 开头的请求 -> 转发到后端
                '/media': {
                    target: env.VITE_SERVE, // 同样使用环境变量中的 http://127.0.0.1:8000
                    changeOrigin: true,
                }
            },
        },
    }
})
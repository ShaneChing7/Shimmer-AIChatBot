import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { compression } from 'vite-plugin-compression2'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // 环境变量获取
    const env = loadEnv(mode, process.cwd())

    return {
        plugins: [
            vue(),
            tailwindcss(),
            // Gzip 压缩
            compression({
                algorithms: ['gzip'],
                threshold: 10240, // 仅压缩 >10KB 的文件
            }),
            // Brotli 压缩
            compression({
                algorithms: ['brotliCompress'],
                threshold: 10240,
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        // 构建优化配置
        build: {
            // CSS 代码分割
            cssCodeSplit: true,
            // chunk 大小警告阈值
            chunkSizeWarningLimit: 500,
            rollupOptions: {
                output: {
                    // 文件名 hash 配置（优化缓存）
                    entryFileNames: 'assets/js/[name]-[hash].js',
                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                    // 代码分割策略
                    manualChunks(id) {
                        // 1. shiki + streamdown-vue 单独分包 (~1.2MB)
                        if (id.includes('node_modules/shiki') ||
                            id.includes('node_modules/@shikijs') ||
                            id.includes('shiki-block-vue') ||
                            id.includes('streamdown-vue')) {
                            return 'vendor-markdown'
                        }
                        // 2. KaTeX 单独分包 (~265KB)
                        if (id.includes('node_modules/katex')) {
                            return 'vendor-katex'
                        }
                        // 3. reka-ui 组件库单独分包 (~47KB)
                        if (id.includes('node_modules/reka-ui')) {
                            return 'vendor-reka-ui'
                        }
                        // 4. Vue 生态合并 (vue + vue-router + pinia)
                        if (id.includes('node_modules/vue') ||
                            id.includes('node_modules/@vue') ||
                            id.includes('node_modules/pinia') ||
                            id.includes('node_modules/vue-router')) {
                            return 'vendor-vue'
                        }
                        // 5. lucide 图标库
                        if (id.includes('node_modules/lucide-vue-next')) {
                            return 'vendor-icons'
                        }
                        // 6. @vueuse 工具库
                        if (id.includes('node_modules/@vueuse')) {
                            return 'vendor-vueuse'
                        }
                        // 7. motion-v 动画库
                        if (id.includes('node_modules/motion-v') ||
                            id.includes('node_modules/@motionone')) {
                            return 'vendor-motion'
                        }
                        // 8. ai SDK (Vercel AI)
                        if (id.includes('node_modules/ai') ||
                            id.includes('node_modules/@ai-sdk')) {
                            return 'vendor-ai'
                        }
                        // 9. vue-i18n 国际化
                        if (id.includes('node_modules/vue-i18n') ||
                            id.includes('node_modules/@intlify')) {
                            return 'vendor-i18n'
                        }
                        // 10. 其他第三方库
                        if (id.includes('node_modules/')) {
                            return 'vendor-misc'
                        }
                    },
                },
            },
        },
        // 依赖预构建优化
        optimizeDeps: {
            include: [
                'vue',
                'vue-router',
                'pinia',
                'axios',
                '@vueuse/core',
                'lucide-vue-next',
                'clsx',
                'tailwind-merge',
            ],
        },
        // 代理服务器
        server: {
            port: 5173, // 显式指定端口，防止随机端口导致跨域配置失效
            proxy: {
                // API 代理
                // 匹配所有以 /api 开头的请求 -> 转发到后端
                [env.VITE_APP_BASE_API]: {
                    target: env.VITE_SERVE,
                    changeOrigin: true,
                    // rewrite: (path) => path.replace(/^\/api/, ''),
                },

                // 媒体文件代理
                // 匹配所有以 /media 开头的请求 -> 转发到后端
                '/media': {
                    target: env.VITE_SERVE, // 同样使用环境变量中的 http://127.0.0.1:8000
                    changeOrigin: true,
                }
            },
        },
    }
})
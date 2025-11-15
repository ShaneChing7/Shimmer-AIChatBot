import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	//环境变量获取
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
		//代理服务器
		server: {
			proxy: {
				[env.VITE_APP_BASE_API]: {
					//服务器地址
					target: env.VITE_SERVE,
				},
			},
		},
	}
})

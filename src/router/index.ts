import { createRouter, createWebHistory } from 'vue-router'
import { constantRoute,anyRoute } from './routes'
const router = createRouter({
	//路由模式
	history: createWebHistory(),
	routes: [...constantRoute,...anyRoute],
	scrollBehavior() {
		return {
			left: 0,
			top: 0,
		}
	},
})

export default router

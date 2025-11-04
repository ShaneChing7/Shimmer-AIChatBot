//常量路由
export const constantRoute = [
	{
		path: '/',
		component: () => import('@/views/ChatView/index.vue'), 
		name: 'chat',
		meta: {
			title: 'chat',
		}
	},
	
	{
		path: '/404',
		component: () => import('@/views/404/index.vue'),
		name: '404',
		meta: {
			title: '404',
		},
	},
]

//任意路由
export const anyRoute = [
	{
		path: '/:pathMatch(.*)*',
		redirect: '/404',
		name: 'any',
		meta: {
			title: '任意路由',
			hidden: true,
		},
	},
]

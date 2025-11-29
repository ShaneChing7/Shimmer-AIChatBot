//进行axios二次封装：请求与响应拦截器
import axios from 'axios'
import pinia from '@/store'; // 1. 导入 pinia 实例
import router from '@/router'
import useUserStore from '@/store/modules/user'
import { useChatStore } from '@/store/modules/chat';
import { toast } from 'vue-sonner';
const request = axios.create({
	baseURL: import.meta.env.VITE_APP_BASE_API,
	timeout: 5000,
})

request.interceptors.request.use((config) => {
	// 4. 在拦截器函数内部获取 store 实例
    const userStore = useUserStore(pinia);
    const token = localStorage.getItem('TOKEN')
    // b. 如果存在 Token，则添加到请求头中
    if (token) {
      // 按照 Simple JWT 要求的格式添加 'Authorization: Bearer <token>'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // c. 务必返回 config 对象
    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
})

request.interceptors.response.use(
	(response) => {
		return response.data
	},
	(error) => {
		// 6. 响应失败时，也获取 store 实例
        const userStore = useUserStore(pinia);
        const chatStore = useChatStore(pinia);
        
        let message = ''
        const status = error.response ? error.response.status : 0

		switch (status) {
			case 400:
				message = '账号或者密码不正确'
				
        // toast.error(message );
				break
			case 401:
				// 7. Token 过期处理
                message = '登录过期，请重新登录' // 提示更友好
                
                // 异步登出操作
                userStore.userLogout().then(() => {
                  // 登出后跳转到登录页
                  router.push('/');
                });
				chatStore.clearChatState()
				toast.error(message)
				break;
			case 403:
				message = '无权访问'
				break
			case 404:
				message = '请求地址错误'
				break
			case 500:
				message = '服务器出现问题'
				break
			default:
				message = '网络出现问题'
				break
		}

		

		return Promise.reject(error)
	},
)

export default request

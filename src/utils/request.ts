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
        // 获取后端返回的数据
        const res = response.data;

        // -------------------------------------------------------------
        // 核心改动：集中处理业务状态码 (Business Logic Errors)
        // -------------------------------------------------------------
        // 假设 200, 201, 204 代表成功
        // 注意：根据你后端的实际返回调整这里的判断条件
        if (res.code === 200 || res.code === 201 || res.code === 204) {
             return res;
        } else {
            // 如果 code 不对，说明业务出错（如密码错误、参数校验失败）
            // 1. 自动弹出错误提示
            toast.error(res.message || '系统未知错误');
            
            // 2. 返回 Rejected Promise，这样 Store 中的 await 下一行就不会执行
            // 直接跳到 catch 块
            return Promise.reject(new Error(res.message || 'Error'));
        }
	},
	(error) => {
		// 6. 响应失败时，也获取 store 实例
        const userStore = useUserStore(pinia);
        const chatStore = useChatStore(pinia);
        
        let message = ''
        const status = error.response ? error.response.status : 0

		switch (status) {
			case 400:
                // 优先显示后端返回的具体错误信息
				message = error.response?.data?.message || '请求参数错误'
				break
			case 401:
				// 7. Token 过期处理
                message = '登录过期，请重新登录' 
                
                // 异步登出操作
                userStore.userLogout().then(() => {
                  // 登出后跳转到登录页
                  router.push('/');
                });
				chatStore.clearChatState()
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

        // -------------------------------------------------------------
        // 核心改动：集中显示 HTTP 错误提示
        // -------------------------------------------------------------
		toast.error(message)

		return Promise.reject(error)
	},
)

export default request
// src/store/modules/user.ts (或者根据你的项目结构 user.ts)
import { defineStore } from 'pinia'
// api接口传入和接收的数据类型
import type { 
  LoginFormData, 
  LoginResponseData, 
  UserInfoResponseData, 
  RegisterFormData, 
  RegisterResponseData,
  PasswordChangeFormData,
  AccountDeleteFormData,
  AvatarUploadData,        // 新增导入
  AvatarUploadResponseData // 新增导入
} from '@/api/user/type'

// 引入 API 函数
import { 
  reqLogin, 
  reqUserInfo, 
  reqRegister, 
  reqPasswordChange, 
  reqAccountDelete,
  reqAvatarUpload // 新增导入
} from '@/api/user'

// 从utils中引入把从登录成功后得到的token存入localStorage的工具
import { SET_TOKEN, GET_TOKEN, REMOVE_TOKEN } from '@/utils/token'
import { REMOVE_MODEL } from "@/utils/model";

interface UserState {
  token: string | null
  username: string
  avatar: string
  uid: string
}

// define一个小仓库
const useUserStore = defineStore('User', {
  // 小仓库对外的数据
  state: (): UserState => ({
    token: GET_TOKEN(),
    username: '',
    // 默认头像，可以根据需求修改
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    uid: ''
  }),

  actions: {
    // 用户注册异步函数
    async userRegister(data: RegisterFormData) {
      const result: RegisterResponseData = await reqRegister(data)
      if (result.code === 200) {
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },
    
    // 用户登录异步函数
    async userLogin(data: LoginFormData) {
      const result: LoginResponseData = await reqLogin(data)
      if (result.code === 200 && result.data) {
        // 后端返回 { code, message, data: { access, refresh } }
        this.token = result.data.access
        SET_TOKEN(result.data.access)
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },

    // 获取用户信息异步函数
    async userInfo() {
      const result: UserInfoResponseData = await reqUserInfo()
      if (result.code === 200 && result.data) {
        this.username = result.data.username
        // 优先使用 avatar_url (如果后端有返回完整路径)，否则使用 avatar
        this.avatar = result.data.avatar_url || result.data.avatar
        this.uid = result.data.uid
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },

    // 上传头像异步函数 (新增)
    async userUploadAvatar(data: AvatarUploadData) {
      const result: AvatarUploadResponseData = await reqAvatarUpload(data)
      if (result.code === 200 && result.data) {
        // 上传成功后，立即更新仓库中的头像数据
        // 后端返回的 data 中包含了最新的 avatar 地址
        let newAvatar = result.data.avatar_url || result.data.avatar
        
        // 核心修复：强制添加时间戳，解决浏览器缓存问题
        if (newAvatar) {
          // 判断 url 是否已经有参数，决定使用 ? 还是 &
          const separator = newAvatar.includes('?') ? '&' : '?'
          newAvatar = `${newAvatar}${separator}t=${Date.now()}`
        }
        
        this.avatar = newAvatar
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },

    // 修改密码异步函数
    async userPasswordChange(data: PasswordChangeFormData) {
      const result = await reqPasswordChange(data)
      if (result.code === 200) {
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },

    // 注销账号异步函数
    async userAccountDelete(data: AccountDeleteFormData) {
      const result = await reqAccountDelete(data)
      if (result.code === 200) {
        // 账号注销成功，清理本地用户信息
        await this.userLogout()
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },

    // 用户登出异步函数
    async userLogout() {
      this.token = ''
      this.username = ''
      this.avatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      this.uid = ''
      REMOVE_TOKEN()
      REMOVE_MODEL()
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
  },
})

// 对外暴露小仓库
export default useUserStore
// src/store/modules/user.ts
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
  AvatarUploadData,
  AvatarUploadResponseData
} from '@/api/user/type'

// 引入 API 函数
import { 
  reqLogin, 
  reqUserInfo, 
  reqRegister, 
  reqPasswordChange, 
  reqAccountDelete,
  reqAvatarUpload 
} from '@/api/user'

import { SET_TOKEN, GET_TOKEN, REMOVE_TOKEN } from '@/utils/token'
import { REMOVE_MODEL } from "@/utils/model";

interface UserState {
  token: string | null
  username: string
  avatar: string
  uid: string
}

const useUserStore = defineStore('User', {
  state: (): UserState => ({
    token: GET_TOKEN(),
    username: '',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    uid: ''
  }),

  actions: {
    // ------------------------------------------------------------------
    // 重构说明：
    // 1. 移除了 if (result.code === 200) 判断，因为拦截器已处理
    // 2. 移除了 else { Promise.reject(...) }，拦截器会自动抛出错误
    // ------------------------------------------------------------------

    // 用户注册
    async userRegister(data: RegisterFormData) {
      await reqRegister(data)
      // 能执行到这里，说明一定是 code === 200
      return 'ok'
    },
    
    // 用户登录
    async userLogin(data: LoginFormData) {
      const result: LoginResponseData = await reqLogin(data)
      
      // 这里的逻辑只处理“成功”的情况
      const access = result.data?.access
      if (!access) {
        // 如果响应没有 access 字段，则抛出错误以便上层或拦截器处理
        throw new Error('Login response missing access token')
      }
      this.token = access
      SET_TOKEN(access)
      return 'ok'
    },

    // 获取用户信息
    async userInfo() {
      const result: UserInfoResponseData = await reqUserInfo()
      
      const data = result.data
      if (!data) {
        // 抛出错误让上层或拦截器处理，避免访问 undefined
        throw new Error('User info response missing data')
      }
      this.username = data.username || ''
      this.avatar = data.avatar_url || data.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      this.uid = data.uid || ''
      return 'ok'
    },

    // 上传头像
    async userUploadAvatar(data: AvatarUploadData) {
      const result: AvatarUploadResponseData = await reqAvatarUpload(data)
      
      let newAvatar = result.data?.avatar_url || result.data?.avatar
      if (newAvatar) {
        const separator = newAvatar.includes('?') ? '&' : '?'
        newAvatar = `${newAvatar}${separator}t=${Date.now()}`
      }
      this.avatar = newAvatar as string
      return 'ok'
    },

    // 修改密码
    async userPasswordChange(data: PasswordChangeFormData) {
      await reqPasswordChange(data)
      return 'ok'
    },

    // 注销账号
    async userAccountDelete(data: AccountDeleteFormData) {
      await reqAccountDelete(data)
      await this.userLogout()
      return 'ok'
    },

    // 用户登出
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

export default useUserStore
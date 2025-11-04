// 用户相关的小仓库
import { defineStore } from 'pinia'
// api接口传入和接收的数据类型
import type { LoginFormData, LoginResponseData, UserInfoResponseData,RegisterFormData,RegisterResponseData } from '@/api/user/type'
// 把api中用request（axios）封装的登录，获取用户信息，登出的异步函数引入user仓库
import { reqLogin, reqUserInfo,reqRegister } from '@/api/user'
// 引入这个小仓库的相关类型
import type { UserState } from './types/type'
// 从utils中引入把从登录成功后得到的token存入localStorage的工具
import { SET_TOKEN, GET_TOKEN, REMOVE_TOKEN } from '@/utils/token'

// define一个小仓库
const useUserStore = defineStore('User', {
  // 小仓库对外的数据
  state: (): UserState => ({
    token: GET_TOKEN(),
    username: '',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
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
        this.avatar = result.data.avatar
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
        REMOVE_TOKEN()
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
  },
})

// 对外暴露小仓库
export default useUserStore

import request from '@/utils/request'  // 统一使用 @/utils/request
import type {
  LoginFormData,
  LoginResponseData,
  UserInfoResponseData,
  RegisterFormData,
  RegisterResponseData,
  AvatarUploadData,
  AvatarUploadResponseData,
  RefreshData,
  RefreshResponseData,
  UserInfoUpdateData,
  UserInfoUpdateResponseData
} from './type'

// -------------------- API 地址 --------------------
export const API = {
  REGISTER_URL: '/api/auth/register/',
  LOGIN_URL: '/api/auth/token/',
  TOKEN_REFRESH_URL: '/api/auth/token/refresh/',
  USERINFO_URL: '/api/auth/me/',
  USERINFO_UPDATE_URL: '/api/auth/me/',
  AVATAR_UPLOAD_URL: '/api/auth/avatar/',
} as const

export type API = (typeof API)[keyof typeof API]

// -------------------- 用户注册 --------------------
export const reqRegister = (data: RegisterFormData) =>
  request.post<any, RegisterResponseData>(API.REGISTER_URL, data)

// -------------------- 登录 --------------------
export const reqLogin = (data: LoginFormData) =>
  request.post<any, LoginResponseData>(API.LOGIN_URL, data)

// -------------------- 刷新 Token --------------------
export const reqRefreshToken = (data: RefreshData) =>
  request.post<any, RefreshResponseData>(API.TOKEN_REFRESH_URL, data)

// -------------------- 获取用户信息 --------------------
export const reqUserInfo = () =>
  request.get<any, UserInfoResponseData>(API.USERINFO_URL)

// -------------------- 更新用户信息 --------------------
export const reqUserInfoUpdate = (data: UserInfoUpdateData) =>
  request.put<any, UserInfoUpdateResponseData>(API.USERINFO_UPDATE_URL, data)

// -------------------- 上传头像 --------------------
export const reqAvatarUpload = (data: AvatarUploadData) => {
  const formData = new FormData()
  formData.append('avatar', data.avatar)
  return request.post<any, AvatarUploadResponseData>(API.AVATAR_UPLOAD_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

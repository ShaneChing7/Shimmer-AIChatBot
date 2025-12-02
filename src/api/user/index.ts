import request from '@/utils/request'
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
  UserInfoUpdateResponseData,
  PasswordChangeFormData,
  PasswordChangeResponseData,
  AccountDeleteFormData,
  AccountDeleteResponseData
} from './type'

// -------------------- API 地址 --------------------
export const API = {
  REGISTER_URL: '/auth/register/',
  LOGIN_URL: '/auth/token/',
  TOKEN_REFRESH_URL: '/auth/token/refresh/',
  USERINFO_URL: '/auth/me/',
  USERINFO_UPDATE_URL: '/auth/me/',
  AVATAR_UPLOAD_URL: '/auth/avatar/', // 对应后端的 AvatarUploadView
  PASSWORD_CHANGE_URL: '/auth/password/change/',
  ACCOUNT_DELETE_URL: '/auth/account/delete/',
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
  formData.append('avatar', data.avatar) // 这里的 key 'avatar' 必须对应后端 Serializer 中的字段名
  return request.post<any, AvatarUploadResponseData>(API.AVATAR_UPLOAD_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// -------------------- 修改密码 --------------------
export const reqPasswordChange = (data: PasswordChangeFormData) =>
  request.post<any, PasswordChangeResponseData>(API.PASSWORD_CHANGE_URL, data)

// -------------------- 注销账号 --------------------
export const reqAccountDelete = (data: AccountDeleteFormData) =>
  request.post<any, AccountDeleteResponseData>(API.ACCOUNT_DELETE_URL, data)
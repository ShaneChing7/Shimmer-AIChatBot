// 定义通用返回类型
export interface ResponseData<T = any> {
  code: number
  message: string
  data?: T
}

// -------------------- 注册 --------------------
export interface RegisterFormData {
  username: string
  password: string
  password2: string
  email?: string
  avatar?: string | File   // avatar 可以是文件或者已上传后的 URL
}

// 注册接口返回数据
export type RegisterResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string
}>

// -------------------- 登录 --------------------
export interface LoginFormData {
  username: string
  password: string
}

// 登录接口返回数据
export type LoginResponseData = ResponseData<{
  access: string
  refresh: string
}>

// -------------------- 刷新 Token --------------------
export interface RefreshData {
  refresh: string
}

// 刷新接口返回数据
export type RefreshResponseData = ResponseData<{
  access: string
}>

// -------------------- 获取用户信息 --------------------
export type UserInfoResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string
}>

// 更新用户信息请求体
export interface UserInfoUpdateData {
  // 用户名不能改，也可以删除 username
  email: string
  avatar?: string | File   // 如果前端支持更新头像，这里也可以放 File
}

// 更新用户信息返回数据
export type UserInfoUpdateResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string
}>

// -------------------- 上传头像 --------------------
export interface AvatarUploadData {
  avatar: File
}

// 上传头像返回数据
export type AvatarUploadResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string
}>

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
  uid: string
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
// 后端 UserProfileSerializer 返回的字段: id, username, email, avatar, avatar_url, uid
export type UserInfoResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string     
  avatar_url?: string // 后端 SerializerMethodField 返回的完整 URL
  uid: string
}>

// 用户信息请求体
export interface UserInfoUpdateData {
  // 用户名不能改，也可以删除 username
  email: string
  avatar?: string | File   
}

// 用户信息返回数据
export type UserInfoUpdateResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string
  uid: string
}>

// -------------------- 上传头像 --------------------
export interface AvatarUploadData {
  avatar: File
}

// 上传头像返回数据
// 后端 AvatarUploadView 也是返回 UserProfileSerializer 的数据
export type AvatarUploadResponseData = ResponseData<{
  id: number
  username: string
  email: string
  avatar: string
  avatar_url?: string
  uid: string
}>

// -------------------- 修改密码 --------------------
export interface PasswordChangeFormData {
  old_password: string
  new_password: string
  new_password2: string
  refresh_token?: string // 可选：用于修改密码后让 token 失效
}

export type PasswordChangeResponseData = ResponseData<null>

// -------------------- 注销账号 --------------------
export interface AccountDeleteFormData {
  password: string
  confirmation: string // 必须输入 "DELETE"
  refresh_token?: string // 可选：用于注销前让 token 失效
}

export type AccountDeleteResponseData = ResponseData<{
  username: string
  id: number
}>
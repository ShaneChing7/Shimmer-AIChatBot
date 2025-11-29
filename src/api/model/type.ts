// src/api/model/type.ts

// 引用通用的 ResponseData，如果没有通用定义文件，可以在这里重新定义
export interface ResponseData<T = any> {
  code: number
  message: string
  data?: T
}

// -------------------- DeepSeek 模型相关 --------------------

// 检查余额/用量的请求参数
export interface CheckUsageParams {
  api_key: string
}

// DeepSeek 余额接口返回的详细结构
// 参考 DeepSeek 官方接口: https://api.deepseek.com/user/balance
export interface BalanceInfo {
  currency: string
  total_balance: string
  granted_balance: string
  topped_up_balance: string
}

export interface DeepSeekBalanceResponse {
  is_available: boolean
  balance_infos: BalanceInfo[]
  note?: string // 后端可能返回的备注
}

// 接口返回的数据结构
export type CheckUsageResponseData = ResponseData<DeepSeekBalanceResponse>
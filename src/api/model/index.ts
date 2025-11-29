// src/api/model/index.ts
import request from '@/utils/request'
import type {
  CheckUsageParams,
  CheckUsageResponseData
} from './type'

// -------------------- API 地址 --------------------
// 假设后端 chat 应用的路由前缀是 /chat
// 最终请求地址: /api/deepseek/check-usage/
export const API = {
  CHECK_USAGE_URL: '/deepseek/check-usage/',
} as const

// -------------------- 检查 DeepSeek 余额/Key有效性 --------------------
export const reqCheckDeepSeekUsage = (data: CheckUsageParams) =>
  request.post<any, CheckUsageResponseData>(API.CHECK_USAGE_URL, data)
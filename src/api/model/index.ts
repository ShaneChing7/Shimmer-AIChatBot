import request from '@/utils/request'
import type {
  CheckUsageParams,
  CheckUsageResponseData
} from './type'

// -------------------- API 地址 --------------------
export const API = {
  CHECK_USAGE_URL: '/deepseek/check-usage/',
} as const

// -------------------- 检查 DeepSeek 余额/Key有效性 --------------------
export const reqCheckDeepSeekUsage = (data: CheckUsageParams) =>
  request.post<any, CheckUsageResponseData>(API.CHECK_USAGE_URL, data)
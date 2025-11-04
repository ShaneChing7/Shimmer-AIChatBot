// index.ts

import request from '@/utils/request' 
import type {
  // ... (保留原有的 User/Auth 导入)
  ResponseData,
  
  // 导入新增的 Chat 类型
  ChatSession,
  ChatSessionListResponseData,
  ChatSessionCreateData,
  ChatSessionCreateResponseData,
  ChatMessageCreateData,
  ChatMessageCreateResponseData,
  ChatSessionDetailResponseData, // 新增导入
} from './type'

// -------------------- API 地址 --------------------
export const API = {
  // ... (保留原有的 User/Auth URL)
  
  // 新增 Chat URL
  CHAT_SESSIONS_URL: '/api/sessions/',
} as const

export type API = (typeof API)[keyof typeof API]

// -------------------- 用户注册 / 登录等 (保留原有) --------------------
// ...

// -------------------- Chat 会话列表 --------------------

/**
 * 获取用户的所有聊天会话列表 (GET /api/sessions/)
 * 返回数据包含分页信息
 */
export const reqChatSessionList = () =>
  request.get<any, ChatSessionListResponseData>(API.CHAT_SESSIONS_URL)


/**
 * 创建新的聊天会话 (POST /api/sessions/)
 * @param data - 包含会话标题
 * 返回数据为完整的会话详情，包含 AI 欢迎消息
 */
export const reqChatSessionCreate = (data: ChatSessionCreateData) =>
  request.post<any, ChatSessionCreateResponseData>(API.CHAT_SESSIONS_URL, data)


/**
 * ✅ 优化 3: 获取会话详情 (GET /api/sessions/{pk}/)
 * @param sessionId - 会话 ID
 * 返回数据为完整的会话详情，包含所有历史消息
 */
export const reqChatSessionDetail = (sessionId: number) =>
  request.get<any, ChatSessionDetailResponseData>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/` // 动态拼接 URL
  )


/**
 * 发送消息并获取 AI 回复 (POST /api/sessions/{pk}/messages/)
 * @param sessionId - 会话 ID (即 URL 中的 pk)
 * @param data - 包含用户消息内容
 * @returns AI 的回复消息对象
 */
export const reqChatMessageCreate = (sessionId: number, data: ChatMessageCreateData) =>
  request.post<any, ChatMessageCreateResponseData>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/messages/`, // 动态拼接 URL
    data
  )

/**
 * 🎯 删除聊天会话 (DELETE /api/sessions/{pk}/)
 * @param sessionId - 会话 ID
 */
export const reqDeleteSession = (sessionId: number) =>
  request.delete<any, ResponseData<null>>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/`
  )

/**
 * 🎯 修改会话标题 (PATCH /api/sessions/{pk}/)
 * @param sessionId - 会话 ID
 * @param data - 包含新标题
 * @returns 更新后的会话基础信息 (ChatSession)
 */
export const reqUpdateSessionTitle = (sessionId: number, data: ChatSessionCreateData) =>
  request.patch<any, ResponseData<ChatSession>>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/`,
    data
  )
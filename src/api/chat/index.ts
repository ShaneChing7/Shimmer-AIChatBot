import request from '@/utils/request' 
import type {
  ResponseData,
  ChatSession,
  ChatSessionListResponseData,
  ChatSessionCreateData,
  ChatSessionCreateResponseData,
  ChatSessionDetailResponseData, 
  ChatSessionExportResponseData, 
} from './type'

// -------------------- API 地址 --------------------
export const API = {
  // Chat URL
  CHAT_SESSIONS_URL: '/sessions/',
} as const

export type API = (typeof API)[keyof typeof API]
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
 * 获取会话详情 (GET /api/sessions/{pk}/)
 * @param sessionId - 会话 ID
 * 返回数据为完整的会话详情，包含所有历史消息
 */
export const reqChatSessionDetail = (sessionId: number) =>
  request.get<any, ChatSessionDetailResponseData>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/` // 动态拼接 URL
  )


/**
 * 删除聊天会话 (DELETE /api/sessions/{pk}/)
 * @param sessionId - 会话 ID
 */
export const reqDeleteSession = (sessionId: number) =>
  request.delete<any, ResponseData<null>>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/`
  )

/**
 * 修改会话标题 (PATCH /api/sessions/{pk}/)
 * @param sessionId - 会话 ID
 * @param data - 包含新标题
 * @returns 更新后的会话基础信息 (ChatSession)
 */
export const reqUpdateSessionTitle = (sessionId: number, data: ChatSessionCreateData) =>
  request.patch<any, ResponseData<ChatSession>>(
    `${API.CHAT_SESSIONS_URL}${sessionId}/`,
    data
  )

/**
 * 删除所有会话 (DELETE /api/sessions/delete-all/)
 */
export const reqDeleteAllSessions = () =>
  request.delete<any, ResponseData<any>>(
    `${API.CHAT_SESSIONS_URL}delete-all/`
  )

/**
 * 导出所有数据 (GET /api/sessions/export-data/)
 */
export const reqExportAllSessions = () =>
  request.get<any, ChatSessionExportResponseData>(
    `${API.CHAT_SESSIONS_URL}export-data/`
  )
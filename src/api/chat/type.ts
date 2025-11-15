
// 定义通用返回类型
export interface ResponseData<T = any> {
  code: number
  message: string
  data?: T
}

// -------------------- 通用分页类型 (新增) --------------------
// DRF 分页的默认结构
export interface PaginationData<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[] // 数据列表
}

// -------------------- Chat (聊天) --------------------

// 2. 消息接口类型 

// 消息发送者角色
export type MessageSender = 'user' | 'ai'

// 单条消息结构 (与后端 ChatMessageSerializer 匹配)
export interface ChatMessage {
  id: number
  session: number // 会话 ID
  sender: MessageSender
  content: string // 消息内容 (可能是 Markdown 格式)
  content_type: 'text' | 'markdown' | 'image_url' // 匹配后端 ContentTypeChoices
  created_at: string // 创建时间
  reasoning_content?: string;  // DeepSeek Reasoner 的推理过程
}

// 1. 会话列表接口类型

// 单个会话基础结构 (用于列表，与后端 ChatSessionListSerializer 匹配)
export interface ChatSession {
  id: number
  title: string // 会话标题
  created_at: string // 创建时间 (ISO 格式)
}

// 会话详情数据结构 (与后端 ChatSessionDetailSerializer 匹配)
// 包含所有消息
export interface ChatSessionDetailData extends ChatSession {
  // user: number // 后端返回 user ID，但通常前端不需要，如果需要请添加
  messages: ChatMessage[] // 包含该会话下的所有消息
}
// 为清晰起见，我们将 ChatSessionDetailData 的响应单独定义
export type ChatSessionDetailResponseData = ResponseData<ChatSessionDetailData>


// ✅ 修改 1: 会话列表接口返回数据
// data 是 PaginationData<ChatSession>，包含分页信息和 results 数组
export type ChatSessionListResponseData = ResponseData<ChatSession[]>


// 3. 创建会话请求和返回类型

// 创建会话请求体 (只需要标题)
export interface ChatSessionCreateData {
  title: string
}

// ✅ 修改 2: 创建会话接口返回数据 (返回完整的会话详情，包含第一条消息)
export type ChatSessionCreateResponseData = ChatSessionDetailResponseData // 直接使用 ChatSessionDetailData

// 4. 发送消息请求和返回类型

// 发送消息请求体
export interface ChatMessageCreateData {
  content: string // 用户发送的消息内容
  content_type?: 'text' // 后端默认是 'text'
}

// 发送消息接口返回数据 (后端返回的是 AI 的回复消息)
export type ChatMessageCreateResponseData = ResponseData<ChatMessage>

// ... (保留其他用户认证相关的类型定义)
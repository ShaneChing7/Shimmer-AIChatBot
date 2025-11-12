// stores/chat.ts (修复流式显示问题)

import { defineStore } from "pinia";
import {
  reqChatSessionList,
  reqChatSessionCreate,
  reqChatSessionDetail,
  reqDeleteSession,
  reqUpdateSessionTitle,
} from "@/api/chat/index";

import type {
  ChatSession,
  ChatSessionDetailData,
  ChatMessage,
} from "@/api/chat/type";

interface ChatState {
  sessions: ChatSession[] | null;
  currentSession: ChatSessionDetailData | null;
  selectedSessionId: number | null;
  loading: boolean;
  error: string | null;
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    sessions: null,
    currentSession: null,
    selectedSessionId: null,
    loading: false,
    error: null,
  }),

  getters: {
    currentMessages: (state) => state.currentSession?.messages || [],
  },

  actions: {
    async fetchSessions() {
      this.loading = true;
      this.error = null;
      try {
        const result = await reqChatSessionList();
        if (result.code === 200 && Array.isArray(result.data)) {
          this.sessions = result.data;
        } else {
          this.error = result.message || "获取会话列表失败";
          this.sessions = [];
        }
      } catch (err: any) {
        this.error = err.message || "网络请求错误";
        this.sessions = [];
      } finally {
        this.loading = false;
      }
    },

    async createSession(title: string) {
      this.loading = true;
      this.error = null;
      try {
        const result = await reqChatSessionCreate({ title });

        if (result.code === 201 && result.data) {
          const newSession = result.data;
          this.currentSession = newSession;

          if (this.sessions) {
            const listSession: ChatSession = {
              id: newSession.id,
              title: newSession.title,
              created_at: newSession.created_at,
            };
            this.sessions.unshift(listSession);
          }

          return true;
        } else {
          this.error = result.message || "创建会话失败";
          return false;
        }
      } catch (err: any) {
        this.error = err.message || "网络请求错误";
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchSessionDetail(sessionId: number): Promise<boolean> {
      if (this.currentSession?.id === sessionId && this.currentSession?.messages.length > 0) {
        return true;
      }
      this.selectedSessionId = sessionId;
      this.loading = true;
      this.error = null;
      try {
        const result = await reqChatSessionDetail(sessionId);

        if (result.code === 200 && result.data) {
          this.currentSession = result.data;
          return true;
        } else {
          this.error = result.message || "获取会话详情失败";
          this.currentSession = null;
          return false;
        }
      } catch (err: any) {
        this.error = err.message || "网络请求错误";
        this.currentSession = null;
        return false;
      } finally {
        this.loading = false;
      }
    },

    async sendMessage(content: string, model: string = 'deepseek-chat') {
  if (!this.currentSession?.id) {
    this.error = "请先选择或创建一个会话。";
    return;
  }

  const sessionId = this.currentSession.id;

  // 1. 添加用户消息
  const userMessage: ChatMessage = {
    id: Date.now() * -1,
    session: sessionId,
    sender: "user",
    content: content,
    content_type: "text",
    created_at: new Date().toISOString(),
  };
  this.currentSession.messages.push(userMessage);

  // 2. 创建 AI 消息占位符
  const tempId = (Date.now() * -1) - 1;
  const aiMessagePlaceholder: ChatMessage = {
    id: tempId,
    session: sessionId,
    sender: "ai",
    content: "",
    content_type: "markdown",
    created_at: new Date().toISOString(),
    reasoning_content: "",  //   使用 reasoning_content 匹配后端字段
  };
  this.currentSession.messages.push(aiMessagePlaceholder);

  // 3. 调用流式 API
  this.loading = true;
  this.error = null;

  try {
    const apiUrl = `/api/api/sessions/${sessionId}/messages-stream/`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem('TOKEN');
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ content, model }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`网络错误: ${response.status} ${errorText}`);
    }

    // 4. 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按行处理 SSE 消息
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          
          if (dataStr === ':keepalive') continue;

          try {
            const data = JSON.parse(dataStr);

            if (data.event === 'done' && data.message) {
              // 流结束,用完整消息替换占位符
              const finalMessage: ChatMessage = {
                ...data.message,
                reasoning_content: data.reasoning || ""  //   保存完整推理过程，使用 reasoning_content
              };
              const index = this.currentSession!.messages.findIndex(
                m => m.id === tempId
              );
              if (index !== -1) {
                this.currentSession!.messages.splice(index, 1, finalMessage);
              }
            } else if (data.event === 'error') {
              throw new Error(`AI 错误: ${data.detail}`);
            } else if (data.type === 'reasoning') {
              //   收到推理内容块
              const index = this.currentSession!.messages.findIndex(
                m => m.id === tempId
              );
              if (index !== -1 && this.currentSession?.messages[index]) {
                if (!this.currentSession.messages[index].reasoning_content) {
                  this.currentSession.messages[index].reasoning_content = "";
                }
                this.currentSession.messages[index].reasoning_content += data.content;
              }
            } else if (data.type === 'content') {
              //   收到正常内容块
              const index = this.currentSession!.messages.findIndex(
                m => m.id === tempId
              );
              if (index !== -1 && this.currentSession?.messages[index]) {
                this.currentSession.messages[index].content += data.content;
              }
            }
          } catch (e) {
            console.warn("无法解析的 SSE data:", dataStr, e);
          }
        }
      }
    }

  } catch (err: any) {
    this.error = err.message || "网络请求错误";
    const index = this.currentSession!.messages.findIndex(
      m => m.id === tempId
    );
    if (index !== -1 && this.currentSession?.messages[index]) {
      this.currentSession!.messages[index].content = `**请求失败:** ${this.error}`;
    }
  } finally {
    this.loading = false;
  }
},

    clearChatState() {
      this.sessions = null;
      this.currentSession = null;
      this.loading = false;
      this.error = null;
    },

    async deleteSession(sessionId: number) {
      this.loading = true;
      try {
        const result = await reqDeleteSession(sessionId);

        if (result.code === 200 || result.code === 204) {
          this.sessions = this.sessions?.filter((s) => s.id !== sessionId) || null;
          if (this.currentSession?.id === sessionId) {
            this.currentSession = null;
          }
          return true;
        } else {
          this.error = result.message || "删除会话失败";
          return false;
        }
      } catch (err: any) {
        this.error = err.message || "网络请求错误";
        return false;
      } finally {
        this.loading = false;
      }
    },

    async updateSessionTitle(sessionId: number, newTitle: string) {
      this.loading = true;
      try {
        const result = await reqUpdateSessionTitle(sessionId, { title: newTitle });

        if (result.code === 200 && result.data) {
          const updatedSession = result.data;

          if (this.sessions) {
            const index = this.sessions.findIndex((s) => s.id === sessionId);
            if (index !== -1 && this.sessions[index]) {
              this.sessions[index].title = updatedSession.title;
            }
          }

          if (this.currentSession?.id === sessionId) {
            this.currentSession.title = updatedSession.title;
          }
          return true;
        } else {
          this.error = result.message || "修改标题失败";
          return false;
        }
      } catch (err: any) {
        this.error = err.message || "网络请求错误";
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
});
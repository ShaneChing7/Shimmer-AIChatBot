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
  MessageFile,
} from "@/api/chat/type";

interface ChatState {
  sessions: ChatSession[] | null;
  currentSession: ChatSessionDetailData | null; // 当前 UI 展示的会话
  selectedSessionId: number | null;
  loading: boolean; // 仅表示列表加载等全局 loading
  error: string | null;
  
  regeneratingMessageId: number | null;
  
}

export const useChatStore = defineStore("chat", {
  state: (): ChatState => ({
    sessions: null,
    currentSession: null,
    selectedSessionId: null,
    loading: false,
    error: null,
    regeneratingMessageId: null,
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

    /**
     * 发送消息 (支持文件上传)
     * @param content 文本内容
     * @param model 模型名称
     * @param files 文件数组
     */
    async sendMessage(content: string, model: string = 'deepseek-chat', files?: File[]) {
      if (!this.currentSession?.id) {
        this.error = "请先选择或创建一个会话。";
        return;
      }

      const sessionId = this.currentSession.id;

      // 添加用户消息到界面
      //乐观更新: 构造临时文件对象用于显示
      const tempFiles: MessageFile[] = [];
      if (files && files.length > 0) {
        files.forEach((f, index) => {
          tempFiles.push({
            id: -1 - index, // 临时 ID
            file_url: URL.createObjectURL(f),
            file_name: f.name, // 保存文件名
            file_type: f.type  // 保存文件类型 (例如 'image/png', 'application/pdf')
          });
        });
      }
      
      const userMessage: ChatMessage = {
        id: Date.now() * -1,
        session: sessionId,
        sender: "user",
        content: content,
        content_type: (files && files.length > 0) ? "file" : "text",
        files: tempFiles, // 使用 files 数组
        created_at: new Date().toISOString(),
      };
      this.currentSession.messages.push(userMessage);

      // 创建 AI 消息占位符
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

      this.loading = true;
      this.error = null;

      // 调用流式 API
      try {
        const apiUrl = `/api/sessions/${sessionId}/messages-stream/`;
        // 构建 FormData 
        // 使用 FormData，以支持文件传输
        const formData = new FormData();
        formData.append('model', model);

        // 即使 content 为空字符串也传过去，后端做了 .get('content') 处理
        formData.append('content', content);

        // 循环追加文件
        if (files && files.length > 0) {
          files.forEach(file => {
            formData.append('files', file); // 后端使用 request.FILES.getlist('files')
          });
        }

        const headers: HeadersInit = {};
        const token = localStorage.getItem('TOKEN');
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        // 使用 FormData 时，不要手动设置 Content-Type 为 application/json 或 multipart/form-data
        // 浏览器会自动设置正确的 Content-Type 和 boundary
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: formData, // 直接传递 formData
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(`网络错误: ${response.status} ${errorText}`);
        }

        //处理流式响应
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
                const aiMsgIndex = this.currentSession!.messages.findIndex(m => m.id === tempId);

                if (data.event === 'done' && data.message) {
                  // 替换 AI 消息
                  const finalMessage: ChatMessage = {
                    ...data.message,
                    reasoning_content: data.reasoning || ""  //   保存完整推理过程，使用 reasoning_content
                  };
                  
                  if (aiMsgIndex !== -1) {
                    this.currentSession!.messages.splice(aiMsgIndex, 1, finalMessage);
                  }
                  // 更新用户消息（为了获得真实的文件 URL 和 ID）
                  // 这里后端一般不返回用户消息，但如果需要精确状态，可以重新 fetch
                  // 简单处理：保留乐观更新的 URL，或者你可以让后端在 done 事件里也返回用户消息的更新
                } else if (data.event === 'error') {
                  throw new Error(`AI 错误: ${data.detail}`);
                } else if (data.type === 'reasoning') {
                  if (aiMsgIndex !== -1) {
                     const msg = this.currentSession!.messages[aiMsgIndex];
                     if (msg) {
                       if (!msg.reasoning_content) msg.reasoning_content = "";
                       msg.reasoning_content += data.content;
                     }
                   }
                } else if (data.type === 'content') {
                  //   收到正常内容块
                  if (aiMsgIndex !== -1) {
                     if (this.currentSession && this.currentSession.messages[aiMsgIndex]) {
                       this.currentSession.messages[aiMsgIndex].content += data.content;
                     }
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
        // 释放临时 URL
        if (tempFiles.length > 0) {
            tempFiles.forEach(f => URL.revokeObjectURL(f.file_url));
        }
      }
    },
    
    async regenerateMessage(messageId: number, model: string = 'deepseek-chat') {
      if (!this.currentSession?.id) {
        this.error = "没有活动的会话。";
        return;
      }

      const sessionId = this.currentSession.id;

      // 找到要重新生成的消息
      const messageIndex = this.currentSession.messages.findIndex(
        (m) => m.id === messageId
      );

      if (messageIndex === -1) {
        this.error = "未找到要重新生成的消息。";
        return;
      }

      const messageToRegenerate = this.currentSession.messages[messageIndex];

      if (!messageToRegenerate || messageToRegenerate.sender !== 'ai') {
        this.error = "只能重新生成 AI 的消息。";
        return;
      }

      // 清空现有消息的内容，准备接收新流
      messageToRegenerate.content = "";
      messageToRegenerate.reasoning_content = "";

      // 调用流式 API
      this.loading = true;
      this.regeneratingMessageId = messageId;
      this.error = null;

      try {
        //  更改 API URL
        const apiUrl = `/api/sessions/${sessionId}/regenerate/`;
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
          // 更改 Body
          body: JSON.stringify({ message_id: messageId, model }),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(`网络错误: ${response.status} ${errorText}`);
        }

        // 处理流式响应 (与 sendMessage 逻辑相同)
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === ':keepalive') continue;

              try {
                const data = JSON.parse(dataStr);

                // 查找消息使用 messageId 而不是 tempId
                const index = this.currentSession!.messages.findIndex(
                  m => m.id === messageId
                );

                if (index === -1) continue; // 如果消息被删除了，就停止

                const targetMessage = this.currentSession!.messages[index];
                if (!targetMessage) continue; // 额外的类型保护，避免 targetMessage 为 undefined

                if (data.event === 'done' && data.message) {
                  // 流结束,用完整消息替换
                  const finalMessage: ChatMessage = {
                    ...data.message,
                    reasoning_content: data.reasoning || ""
                  };
                  this.currentSession!.messages.splice(index, 1, finalMessage);

                } else if (data.event === 'error') {
                  throw new Error(`AI 错误: ${data.detail}`);

                } else if (data.type === 'reasoning') {
                  // 收到推理内容块
                  if (!targetMessage.reasoning_content) {
                    targetMessage.reasoning_content = "";
                  }
                  targetMessage.reasoning_content += data.content;

                } else if (data.type === 'content') {
                  // 收到正常内容块
                  targetMessage.content += data.content;
                }
              } catch (e) {
                console.warn("无法解析的 SSE data:", dataStr, e);
              }
            }
          }
        }

      } catch (err: any) {
        this.error = err.message || "网络请求错误";
        // 更新失败状态到 *原始* 消息
        const index = this.currentSession!.messages.findIndex(
          m => m.id === messageId
        );
        if (index !== -1 && this.currentSession?.messages[index]) {
          this.currentSession!.messages[index].content = `**重新生成失败:** ${this.error}`;
        }
      } finally {
        this.loading = false;
        this.regeneratingMessageId = null;
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
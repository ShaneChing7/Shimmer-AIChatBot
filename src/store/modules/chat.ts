import { defineStore } from "pinia";
import {
  reqChatSessionList,
  reqChatSessionCreate,
  reqChatSessionDetail,
  reqDeleteSession,
  reqUpdateSessionTitle,
  reqDeleteAllSessions,
  reqExportAllSessions,
} from "@/api/chat/index";
import { toast } from 'vue-sonner';

import type {
  ChatSession,
  ChatSessionDetailData,
  MessageFile,
} from "@/api/chat/type";
import useUserStore from "./user";
import useModelStore from "@/store/modules/model"; 

/**
 * ChatState 接口定义
 * 定义聊天模块的状态结构
 */
interface ChatState {
  // 会话列表数据 (侧边栏显示)
  sessions: ChatSession[] | null;
  // 当前选中的会话详情数据 (包含消息列表)
  currentSession: ChatSessionDetailData | null;
  // 当前选中的会话 ID
  selectedSessionId: number | null;
  // 全局加载状态 (主要用于非流式操作，如加载列表、删除等)
  loading: boolean;
  // 错误信息存储
  error: string | null;
  // 正在重新生成的消息 ID (用于 UI 显示 loading 状态)
  regeneratingMessageId: number | null;
  // 会话详情缓存 Map<sessionId, SessionData>，避免重复请求
  sessionCache: Map<number, ChatSessionDetailData>;
  // 中断控制器 Map<sessionId, AbortController>，用于停止流式生成
  abortControllers: Map<number, AbortController>;
  // 正在生成中的会话 ID 集合 (用于 UI 禁用输入框或显示停止按钮)
  generatingSessionIds: Set<number>;
  // 正在停止中的会话 ID 集合 (用于处理停止时的状态过渡)
  stoppingSessionIds: Set<number>;
}

export const useChatStore = defineStore("chat", {
  // 初始化 State
  state: (): ChatState => ({
    sessions: null,
    currentSession: null,
    selectedSessionId: null,
    loading: false,
    error: null,
    regeneratingMessageId: null,
    sessionCache: new Map(),
    abortControllers: new Map(),
    generatingSessionIds: new Set(),
    stoppingSessionIds: new Set(),
  }),

  getters: {
    // 获取当前会话的所有消息列表，若无则返回空数组
    currentMessages: (state) => state.currentSession?.messages || [],
    
    // 判断当前选中的会话是否正在生成回复
    isCurrentGenerating: (state) => {
      const currentId = state.currentSession?.id || state.selectedSessionId;
      return currentId ? state.generatingSessionIds.has(currentId) : false;
    }
  },

  actions: {
    // 检查指定 ID 的会话是否正在生成中
    isGenerating(sessionId: number) {
      return this.generatingSessionIds.has(sessionId);
    },

    // ------------------------------------------------------------------
    // REST API 操作区域
    // ------------------------------------------------------------------

    /**
     * 获取会话列表
     * 设置 loading 状态，调用接口获取侧边栏会话列表
     */
    async fetchSessions() {
      this.loading = true;
      this.error = null; // 重置错误状态
      try {
        const result = await reqChatSessionList();
        // 确保数据是数组，否则赋空数组
        this.sessions = Array.isArray(result.data) ? result.data : [];
      } catch (err: any) {
        this.error = "获取会话列表失败"; 
        this.sessions = [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * 创建新会话
     * @param title 会话标题
     * @returns boolean 创建是否成功
     */
    async createSession(title: string) {
      this.loading = true;
      this.error = null;
      try {
        const result = await reqChatSessionCreate({ title });
        const newSession = result?.data;
        
        if (!newSession) {
          return false;
        }
        
        // 1. 立即缓存新会话详情
        this.sessionCache.set(newSession.id, newSession);
        // 2. 设置为当前会话
        this.currentSession = newSession;
        this.selectedSessionId = newSession.id;
        
        // 3. 乐观更新：将新会话添加到列表头部，避免再次拉取列表
        if (this.sessions) {
          const listSession: ChatSession = {
            id: newSession.id,
            title: newSession.title,
            created_at: newSession.created_at,
          };
          this.sessions.unshift(listSession);
        }
        return true;
      } catch (err: any) {
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 获取会话详情 (包含消息记录)
     * @param sessionId 会话ID
     * @param forceUpdate 是否强制从服务器更新 (不使用缓存)
     */
    async fetchSessionDetail(sessionId: number, forceUpdate = false): Promise<boolean> {
      // 如果当前已经是该会话且有数据，且不强制更新，直接返回
      if (!forceUpdate && this.currentSession?.id === sessionId && this.currentSession?.messages.length > 0) {
        return true;
      }
      this.selectedSessionId = sessionId;
      this.error = null;

      // 如果缓存中有数据且不强制更新，优先使用缓存
      if (!forceUpdate && this.sessionCache.has(sessionId)) {
        this.currentSession = this.sessionCache.get(sessionId)!;
        // 如果该会话正在生成中，不打断流式更新，直接返回
        if (this.generatingSessionIds.has(sessionId)) {
            return true;
        }
      }

      this.loading = true;
      try {
        const result = await reqChatSessionDetail(sessionId);
        
        // --- 逻辑处理：处理手动停止后的状态修正 ---
        const data = result?.data;
        if (this.stoppingSessionIds.has(sessionId) && data?.messages) {
             const msgs = data.messages;
             if (msgs.length > 0) {
                 const lastMsg = msgs[msgs.length - 1];
                 // 如果最后一条是 AI 消息且状态是 completed，但在停止列表中，修正为 interrupted
                 if (lastMsg?.sender === 'ai' && lastMsg.status === 'completed') {
                     lastMsg.status = 'interrupted';
                 }
             }
             this.stoppingSessionIds.delete(sessionId);
        }

        if (data) {
          // 更新缓存和当前状态
          this.sessionCache.set(sessionId, data);
          this.currentSession = data;
          return true;
        } else {
          this.currentSession = null;
          return false;
        }
      } catch (err: any) {
        this.currentSession = null;
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 删除会话
     */
    async deleteSession(sessionId: number) {
      this.loading = true;
      try {
        await reqDeleteSession(sessionId); 

        // 从列表中移除
        this.sessions = this.sessions?.filter((s) => s.id !== sessionId) || null;
        // 如果删除的是当前选中的会话，清空当前会话状态
        if (this.currentSession?.id === sessionId) {
          this.currentSession = null;
        }
        return true;
      } catch (err: any) {
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新会话标题
     */
    async updateSessionTitle(sessionId: number, newTitle: string) {
      this.loading = true;
      try {
        const result = await reqUpdateSessionTitle(sessionId, { title: newTitle });
        const updatedSession = result.data;

        if (!updatedSession) {
          return false;
        }

        // 同时更新列表中的标题
        if (this.sessions) {
          const index = this.sessions.findIndex((s) => s.id === sessionId);
          if (index !== -1 && this.sessions[index]) {
            this.sessions[index].title = updatedSession.title;
          }
        }

        // 如果是当前会话，也更新详情中的标题
        if (this.currentSession?.id === sessionId) {
          this.currentSession.title = updatedSession.title;
        }
        return true;
      } catch (err: any) {
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 删除所有会话
     * 清空后端数据及前端缓存
     */
    async deleteAllSessions() {
      this.loading = true;
      try {
        await reqDeleteAllSessions();
        // 清空本地状态
        this.sessions = [];
        this.currentSession = null;
        this.sessionCache.clear();
        this.selectedSessionId = null;
        return true;
      } catch (error) {
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 导出所有数据
     */
    async exportAllData() {
        this.loading = true;
        try {
            const result = await reqExportAllSessions();
            return result.data || [];
        } catch (error) {
            return null;
        } finally {
            this.loading = false;
        }
    },


    // ------------------------------------------------------------------
    // 流式通信核心区域 (SSE / Fetch)
    // ------------------------------------------------------------------

    /**
     * 发送消息 (核心流式交互)
     * @param content 消息内容
     * @param model 模型名称
     * @param files 附件文件列表
     */
    async sendMessage(content: string, model: string = 'deepseek-chat', files?: File[]) {
      // 前置校验
      if (!this.currentSession?.id) {
        toast.error("请先选择或创建一个会话。"); 
        return;
      }

      const sessionId = this.currentSession.id;

      // 1. 处理文件预览URL (用于乐观更新 UI)
      const tempFiles: MessageFile[] = [];
      if (files && files.length > 0) {
        files.forEach((f, index) => {
          tempFiles.push({
            id: -1 - index,  // 临时 ID
            file_url: URL.createObjectURL(f),
            file_name: f.name, 
            file_type: f.type  
          });
        });
      }
      
      // 2. 确保缓存存在
      if (!this.sessionCache.has(sessionId)) {
        this.sessionCache.set(sessionId, this.currentSession);
      }
      const cachedSession = this.sessionCache.get(sessionId)!;

      // 3. 乐观更新：立即将用户消息推入 UI
      cachedSession.messages.push({
        id: Date.now() * -1, // 临时负数 ID
        session: sessionId,
        sender: "user",
        content: content,
        content_type: (files && files.length > 0) ? "file" : "text",
        files: tempFiles,
        created_at: new Date().toISOString(),
        status: 'completed',
      });

      // 4. 乐观更新：预置一条空的 AI 消息，用于接收流式数据
      const tempId = (Date.now() * -1) - 1;
      cachedSession.messages.push({
        id: tempId,
        session: sessionId,
        sender: "ai",
        content: "",
        content_type: "markdown",
        created_at: new Date().toISOString(),
        reasoning_content: "", // 初始化推理内容字段
        status: 'generating',  // 标记为生成中
      });

      // 5. 设置流式控制 (AbortController)
      this.generatingSessionIds.add(sessionId);
      const controller = new AbortController();
      this.abortControllers.set(sessionId, controller);

      try {
        // 构建请求体 (FormData 处理多文件上传)
        const apiUrl = `/api/sessions/${sessionId}/messages-stream/`;
        const formData = new FormData();
        formData.append('model', model);
        formData.append('content', content);

        if (files && files.length > 0) {
          files.forEach(file => {
            formData.append('files', file); 
          });
        }

        // 构建 Header (携带 Auth Token 和 API Key)
        const headers: HeadersInit = {};
        const token = localStorage.getItem('TOKEN');
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const modelStore = useModelStore();
        if (modelStore.apiKey) {
          headers["X-DeepSeek-API-Key"] = modelStore.apiKey;
        }

        // 发起原生 fetch 请求
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: formData, 
          signal: controller.signal, // 绑定中断信号
        });

        // 处理 HTTP 错误
        if (!response.ok || !response.body) {
          // 特殊处理 401 登录失效
          if(response.status == 401){
            this.clearChatState()
            const userStore = useUserStore()
            userStore.userLogout()
            toast.error("登录已失效, 请重新登陆")
          }
          const errorText = await response.text();
          throw new Error(`网络错误: ${response.status} ${errorText}`);
        }
        
        // 6. 调用核心处理函数解析流
        await this.processStreamResponse(response, sessionId, tempId, false);

      } catch (err: any) {
        // 忽略用户手动中止的错误
        if (err.name === 'AbortError') {
           // ignore
        } else {
           // 将错误信息显示在消息气泡中
           const idx = cachedSession.messages.findIndex(m => m.id === tempId);
           if (idx !== -1) {
              if(!cachedSession.messages[idx]) return;
              cachedSession.messages[idx].content += `\n**[请求出错: ${err.message}]**`;
              cachedSession.messages[idx].status = 'error';
           }
        }
      } finally {
        // 清理状态
        this.generatingSessionIds.delete(sessionId);
        this.abortControllers.delete(sessionId);
        // 释放文件预览内存
        tempFiles.forEach(f => URL.revokeObjectURL(f.file_url));
      }
    },
    
    /**
     * 停止生成
     * 手动中断流式请求
     */
    stopGenerate(sessionId: number) {
      const controller = this.abortControllers.get(sessionId);
      if (controller) {
        controller.abort(); // 发送中止信号
        this.abortControllers.delete(sessionId);
      }
      this.generatingSessionIds.delete(sessionId);
      
      // 标记该会话正在停止处理中
      this.stoppingSessionIds.add(sessionId);

      if (this.currentSession?.id === sessionId) {
          this.regeneratingMessageId = null; 
      }
      
      // 延迟刷新详情，确保后端状态同步
      setTimeout(() => {
        this.fetchSessionDetail(sessionId, true); 
      }, 500); 
    },

    /**
     * 继续生成 (Continue)
     * 当回复被截断时，调用此接口继续生成
     */
    async continueGenerate(sessionId: number, model: string = 'deepseek-chat') {
      if (!sessionId) return;
      const session = this.sessionCache.get(sessionId);
      if (!session || session.messages.length === 0) return;

      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage?.sender !== 'ai') return; 

      // 确保上一条消息有合法的 ID
      if (lastMessage.id < 0) {
          toast.warning("正在同步消息状态，请稍后再试...");
          await this.fetchSessionDetail(sessionId, true);
          return;
      }

      this.generatingSessionIds.add(sessionId);
      this.regeneratingMessageId = lastMessage.id;
      const controller = new AbortController();
      this.abortControllers.set(sessionId, controller);

      try {
        const apiUrl = `/api/sessions/${sessionId}/regenerate/`;
        const headers: HeadersInit = { "Content-Type": "application/json" };
        const token = localStorage.getItem('TOKEN');
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const modelStore = useModelStore();
        if (modelStore.apiKey) {
          (headers as any)["X-DeepSeek-API-Key"] = modelStore.apiKey;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ 
            message_id: lastMessage.id, 
            model,
            type:'continue' // 标识为继续生成模式
          }), 
          signal: controller.signal, 
        });

        if (!response.ok){
          if(response.status == 401){
            this.clearChatState()
            const userStore = useUserStore()
            userStore.userLogout()
            toast.error("登录已失效, 请重新登陆")
          }
          throw new Error("Net Error");
        } 

        // 复用流处理函数，appendMode = true
        await this.processStreamResponse(response, sessionId, lastMessage.id, true);

      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Generation stopped by user');
        } else {
          this.error = err.message;
        }
      } finally {
        this.generatingSessionIds.delete(sessionId);
        this.abortControllers.delete(sessionId);
        this.regeneratingMessageId = null;
      }
    },

    /**
     * 重新生成 (Regenerate)
     * 重新生成指定消息的回复
     */
    async regenerateMessage(messageId: number, model: string = 'deepseek-chat') {
        if (!this.currentSession?.id) return;
        const sessionId = this.currentSession.id;
        
        const session = this.sessionCache.get(sessionId);
        if (!session) return;

        const msgIndex = session.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;
        
        if(!session.messages[msgIndex]) return;
        // 清空原有内容，重置状态
        session.messages[msgIndex].content = "";
        session.messages[msgIndex].reasoning_content = "";
        session.messages[msgIndex].status = "generating"; 

        this.generatingSessionIds.add(sessionId);
        this.regeneratingMessageId = messageId;

        const controller = new AbortController();
        this.abortControllers.set(sessionId, controller);

        try {
            const headers: HeadersInit = { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('TOKEN')}`
            };
            const modelStore = useModelStore();
            if (modelStore.apiKey) {
              (headers as any)["X-DeepSeek-API-Key"] = modelStore.apiKey;
            }

            const response = await fetch(`/api/sessions/${sessionId}/regenerate/`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ message_id: messageId, model }),
                signal: controller.signal
            });
             if (!response.ok){
              if(response.status == 401){
                this.clearChatState()
                const userStore = useUserStore()
                userStore.userLogout()
                toast.error("登录已失效, 请重新登陆")
              }
              throw new Error("Net Error");
             } 
             // 复用流处理函数，appendMode = false (覆盖模式)
             await this.processStreamResponse(response, sessionId, messageId, false);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                 session.messages[msgIndex].content = `Error: ${e.message}`;
                 session.messages[msgIndex].status = 'completed';
            }
        } finally {
            this.generatingSessionIds.delete(sessionId);
            this.abortControllers.delete(sessionId);
            this.regeneratingMessageId = null;
        }
    },

    /**
     * 流式响应处理器 (核心 SSE 解析器)
     * @param response Fetch Response 对象
     * @param sessionId 会话 ID
     * @param targetMessageId 目标消息 ID
     * @param appendMode 是否为追加模式 (true=继续生成, false=重新生成/普通对话)
     */
    async processStreamResponse(response: Response, sessionId: number, targetMessageId: number, appendMode: boolean) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        // let hasReceivedData = false;

        try {
          // 循环读取流数据块
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // 解码并存入缓冲区
              buffer += decoder.decode(value, { stream: true });
              let newlineIndex;
              // 处理缓冲区中的完整行
              while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                  const line = buffer.slice(0, newlineIndex).trim();
                  buffer = buffer.slice(newlineIndex + 1);
                  
                  // 解析 SSE 格式: data: {...}
                  if (line.startsWith('data: ')) {
                      const dataStr = line.substring(6);
                      if (dataStr === ':keepalive') continue; // 忽略心跳包
                      
                      try {
                          const data = JSON.parse(dataStr);
                          // hasReceivedData = true;

                          const session = this.sessionCache.get(sessionId);
                          if (!session) break; 

                          const msgIndex = session.messages.findIndex(m => m.id === targetMessageId);
                          if (msgIndex === -1) continue;
                          const targetMsg = session.messages[msgIndex];

                          // 事件类型 1: 错误
                          if (data.event === 'error') {
                              console.error("Stream Error Event:", data.detail);
                              if (!targetMsg) continue;
                              targetMsg.content += `\n\n> ⚠️ **API Error**: ${data.detail}\n`;
                              targetMsg.status = 'completed'; 
                              toast.error(`API Error: ${data.detail}`);
                              return; 
                          }

                          // 事件类型 2: 完成
                          else if (data.event === 'done') {
                              if (appendMode) {
                                  // 继续生成模式：只更新状态，不替换整个对象
                                  if (targetMsg) {
                                      targetMsg.status = 'completed'; 
                                      if (data.message && data.message.id) {
                                          targetMsg.id = data.message.id; // 更新为真实 ID
                                      }
                                  }
                              } else {
                                  // 普通/重试模式：使用后端返回的完整消息对象替换占位对象
                                  session.messages.splice(msgIndex, 1, { ...data.message, reasoning_content: data.reasoning || "" });
                              }
                          } 
                          
                          // 事件类型 3: 推理内容 (DeepSeek Reasoner)
                          else if (data.type === 'reasoning') {
                              if (targetMsg) {
                                  if (!targetMsg.reasoning_content) targetMsg.reasoning_content = "";
                                  targetMsg.reasoning_content += data.content;
                              }
                          } 
                          // 事件类型 4: 普通内容
                          else if (data.type === 'content') {
                              if (targetMsg) {
                                  targetMsg.content += data.content;
                              }
                          }
                      } catch (e) {
                          console.warn("JSON Parse Error on line:", line);
                      }
                  } 
                  // 容错处理：有时错误信息可能直接返回 JSON 而非 SSE 格式
                  else if (line.startsWith('{') && line.endsWith('}')) {
                      try {
                          const jsonObj = JSON.parse(line);
                          if (jsonObj.event === 'error' || jsonObj.error) {
                             const errorMsg = jsonObj.detail || jsonObj.error?.message || "Unknown error";
                             const session = this.sessionCache.get(sessionId);
                             if (session) {
                                const msgIndex = session.messages.findIndex(m => m.id === targetMessageId);
                                if (msgIndex !== -1) {
                                   const targetMsg = session.messages[msgIndex];
                                   if (targetMsg) {
                                        targetMsg.content += `\n\n> ⚠️ **Error**: ${errorMsg}`;
                                        targetMsg.status = 'error';
                                   }
                                }
                             }
                             toast.error(errorMsg);
                             return;
                          }
                      } catch(e) {}
                  }
              }
          }
        } catch (error: any) {
           console.error("Stream reading error:", error);
           throw error; 
        } finally {
            // 最终兜底检查：如果流结束但状态仍为 generating，标记为完成或错误
            const session = this.sessionCache.get(sessionId);
            if (session) {
                const msgIndex = session.messages.findIndex(m => m.id === targetMessageId);
                if (msgIndex !== -1) {
                    const msg = session.messages[msgIndex];
                    if (msg?.status === 'generating') {
                         if (!msg.content && !msg.reasoning_content) {
                             msg.status = 'error';
                             msg.content = "**[Connection Closed Without Response]**";
                         } else {
                             msg.status = 'completed'; 
                         }
                    }
                }
            }
        }
    },

    /**
     * 清理 Store 状态 (通常在登出时调用)
     */
    clearChatState() {
      this.abortControllers.forEach(c => c.abort());
      this.abortControllers.clear();
      this.generatingSessionIds.clear();
      this.sessionCache.clear();
      this.sessions = null;
      this.currentSession = null;
    },
  },
});
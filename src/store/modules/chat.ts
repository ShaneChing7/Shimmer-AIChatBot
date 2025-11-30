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

interface ChatState {
  sessions: ChatSession[] | null;
  currentSession: ChatSessionDetailData | null;
  selectedSessionId: number | null;
  loading: boolean;
  error: string | null;
  regeneratingMessageId: number | null;
  sessionCache: Map<number, ChatSessionDetailData>;
  abortControllers: Map<number, AbortController>;
  generatingSessionIds: Set<number>;
  stoppingSessionIds: Set<number>;
}

export const useChatStore = defineStore("chat", {
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
    currentMessages: (state) => state.currentSession?.messages || [],
    isCurrentGenerating: (state) => {
      const currentId = state.currentSession?.id || state.selectedSessionId;
      return currentId ? state.generatingSessionIds.has(currentId) : false;
    }
  },

  actions: {
    isGenerating(sessionId: number) {
      return this.generatingSessionIds.has(sessionId);
    },

    // ------------------------------------------------------------------
    // 重构部分：普通 Axios 请求 (Fetch 会话列表、创建、详情等)
    // 移除手动 error 设置和 Toast，保留 try-finally 管理 loading
    // ------------------------------------------------------------------

    async fetchSessions() {
      this.loading = true;
      // 仅需重置本地 error 状态，不需要处理具体的错误信息
      this.error = null; 
      try {
        const result = await reqChatSessionList();
        // 直接赋值，无需判断 code === 200
        this.sessions = Array.isArray(result.data) ? result.data : [];
      } catch (err: any) {
        // 如果需要 UI 显示“加载失败”占位符，这里可以保留
        // 如果不需要，catch 块甚至可以留空，因为 request.ts 已经弹窗了
        this.error = "获取会话列表失败"; 
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
        const newSession = result?.data;
        
        if (!newSession) {
          return false;
        }
        
        this.sessionCache.set(newSession.id, newSession);
        this.currentSession = newSession;
        this.selectedSessionId = newSession.id;
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
        // request.ts 已处理错误提示，这里只需返回 false 告知组件
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchSessionDetail(sessionId: number, forceUpdate = false): Promise<boolean> {
      if (!forceUpdate && this.currentSession?.id === sessionId && this.currentSession?.messages.length > 0) {
        return true;
      }
      this.selectedSessionId = sessionId;
      this.error = null;

      if (!forceUpdate && this.sessionCache.has(sessionId)) {
        this.currentSession = this.sessionCache.get(sessionId)!;
        if (this.generatingSessionIds.has(sessionId)) {
            return true;
        }
      }

      this.loading = true;
      try {
        const result = await reqChatSessionDetail(sessionId);
        
        // 逻辑处理
        const data = result?.data;
        if (this.stoppingSessionIds.has(sessionId) && data?.messages) {
             const msgs = data.messages;
             if (msgs.length > 0) {
                 const lastMsg = msgs[msgs.length - 1];
                 if (lastMsg?.sender === 'ai' && lastMsg.status === 'completed') {
                     lastMsg.status = 'interrupted';
                 }
             }
             this.stoppingSessionIds.delete(sessionId);
        }

        if (data) {
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

    async deleteSession(sessionId: number) {
      this.loading = true;
      try {
        await reqDeleteSession(sessionId); // 若出错会抛出异常跳到 catch

        this.sessions = this.sessions?.filter((s) => s.id !== sessionId) || null;
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

    async updateSessionTitle(sessionId: number, newTitle: string) {
      this.loading = true;
      try {
        const result = await reqUpdateSessionTitle(sessionId, { title: newTitle });
        const updatedSession = result.data;

        // Guard against undefined response data
        if (!updatedSession) {
          return false;
        }

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
      } catch (err: any) {
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- 新增: 删除所有会话 ---
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

    // --- 新增: 导出所有数据 ---
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
    // 注意：下面的 sendMessage 和 continueGenerate 使用了原生 fetch
    // 它们不受 request.ts 拦截器控制，所以这里的错误处理需要保留
    // ------------------------------------------------------------------

    async sendMessage(content: string, model: string = 'deepseek-chat', files?: File[]) {
      if (!this.currentSession?.id) {
        toast.error("请先选择或创建一个会话。"); // 这里仍需手动提示
        return;
      }

      const sessionId = this.currentSession.id;

      const tempFiles: MessageFile[] = [];
      if (files && files.length > 0) {
        files.forEach((f, index) => {
          tempFiles.push({
            id: -1 - index, 
            file_url: URL.createObjectURL(f),
            file_name: f.name, 
            file_type: f.type  
          });
        });
      }
      
      if (!this.sessionCache.has(sessionId)) {
        this.sessionCache.set(sessionId, this.currentSession);
      }
      const cachedSession = this.sessionCache.get(sessionId)!;

      cachedSession.messages.push({
        id: Date.now() * -1,
        session: sessionId,
        sender: "user",
        content: content,
        content_type: (files && files.length > 0) ? "file" : "text",
        files: tempFiles,
        created_at: new Date().toISOString(),
        status: 'completed',
      });

      const tempId = (Date.now() * -1) - 1;
      cachedSession.messages.push({
        id: tempId,
        session: sessionId,
        sender: "ai",
        content: "",
        content_type: "markdown",
        created_at: new Date().toISOString(),
        reasoning_content: "",
        status: 'generating', 
      });

      this.generatingSessionIds.add(sessionId);
      const controller = new AbortController();
      this.abortControllers.set(sessionId, controller);

      try {
        const apiUrl = `/api/sessions/${sessionId}/messages-stream/`;
        const formData = new FormData();
        formData.append('model', model);
        formData.append('content', content);

        if (files && files.length > 0) {
          files.forEach(file => {
            formData.append('files', file); 
          });
        }

        const headers: HeadersInit = {};
        const token = localStorage.getItem('TOKEN');
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const modelStore = useModelStore();
        if (modelStore.apiKey) {
          headers["X-DeepSeek-API-Key"] = modelStore.apiKey;
        }

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: formData, 
          signal: controller.signal, 
        });

        if (!response.ok || !response.body) {
          if(response.status == 401){
            this.clearChatState()
            const userStore = useUserStore()
            userStore.userLogout()
            toast.error("登录已失效, 请重新登陆")
          }
          const errorText = await response.text();
          throw new Error(`网络错误: ${response.status} ${errorText}`);
        }
        await this.processStreamResponse(response, sessionId, tempId, false);

      } catch (err: any) {
        if (err.name === 'AbortError') {
           // ignore
        } else {
           const idx = cachedSession.messages.findIndex(m => m.id === tempId);
           if (idx !== -1) {
              if(!cachedSession.messages[idx]) return;
              cachedSession.messages[idx].content += `\n**[请求出错: ${err.message}]**`;
              cachedSession.messages[idx].status = 'error';
           }
        }
      } finally {
        this.generatingSessionIds.delete(sessionId);
        this.abortControllers.delete(sessionId);
        tempFiles.forEach(f => URL.revokeObjectURL(f.file_url));
      }
    },
    
    stopGenerate(sessionId: number) {
      const controller = this.abortControllers.get(sessionId);
      if (controller) {
        controller.abort(); 
        this.abortControllers.delete(sessionId);
      }
      this.generatingSessionIds.delete(sessionId);
      
      this.stoppingSessionIds.add(sessionId);

      if (this.currentSession?.id === sessionId) {
          this.regeneratingMessageId = null; 
      }
      
      setTimeout(() => {
        this.fetchSessionDetail(sessionId, true); 
      }, 500); 
    },

    async continueGenerate(sessionId: number, model: string = 'deepseek-chat') {
      if (!sessionId) return;
      const session = this.sessionCache.get(sessionId);
      if (!session || session.messages.length === 0) return;

      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage?.sender !== 'ai') return; 

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
            type:'continue' 
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

    async regenerateMessage(messageId: number, model: string = 'deepseek-chat') {
        if (!this.currentSession?.id) return;
        const sessionId = this.currentSession.id;
        
        const session = this.sessionCache.get(sessionId);
        if (!session) return;

        const msgIndex = session.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;
        
        if(!session.messages[msgIndex]) return;
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

    async processStreamResponse(response: Response, sessionId: number, targetMessageId: number, appendMode: boolean) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        let hasReceivedData = false;

        try {
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
                          hasReceivedData = true;

                          const session = this.sessionCache.get(sessionId);
                          if (!session) break; 

                          const msgIndex = session.messages.findIndex(m => m.id === targetMessageId);
                          if (msgIndex === -1) continue;
                          const targetMsg = session.messages[msgIndex];

                          if (data.event === 'error') {
                              console.error("Stream Error Event:", data.detail);
                              if (!targetMsg) continue;
                              targetMsg.content += `\n\n> ⚠️ **API Error**: ${data.detail}\n`;
                              targetMsg.status = 'completed'; 
                              toast.error(`API Error: ${data.detail}`);
                              return; 
                          }

                          else if (data.event === 'done') {
                              if (appendMode) {
                                  if (targetMsg) {
                                      targetMsg.status = 'completed'; 
                                      if (data.message && data.message.id) {
                                          targetMsg.id = data.message.id;
                                      }
                                  }
                              } else {
                                  session.messages.splice(msgIndex, 1, { ...data.message, reasoning_content: data.reasoning || "" });
                              }
                          } 
                          
                          else if (data.type === 'reasoning') {
                              if (targetMsg) {
                                  if (!targetMsg.reasoning_content) targetMsg.reasoning_content = "";
                                  targetMsg.reasoning_content += data.content;
                              }
                          } else if (data.type === 'content') {
                              if (targetMsg) {
                                  targetMsg.content += data.content;
                              }
                          }
                      } catch (e) {
                          console.warn("JSON Parse Error on line:", line);
                      }
                  } 
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
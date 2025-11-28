// stores/chat.ts (修复流式显示问题)

import { defineStore } from "pinia";
import {
  reqChatSessionList,
  reqChatSessionCreate,
  reqChatSessionDetail,
  reqDeleteSession,
  reqUpdateSessionTitle,
} from "@/api/chat/index";
import { toast } from 'vue-sonner'; //  引入 Toast

import type {
  ChatSession,
  ChatSessionDetailData,
  ChatMessage,
  MessageFile,
} from "@/api/chat/type";
import useUserStore from "./user";

interface ChatState {
  sessions: ChatSession[] | null;
  currentSession: ChatSessionDetailData | null; // 当前 UI 展示的会话
  selectedSessionId: number | null;
  loading: boolean; // 仅表示列表加载等全局 loading
  error: string | null;

  regeneratingMessageId: number | null;
  
  //  新增: 会话详情缓存 (关键：用于后台更新数据)
  sessionCache: Map<number, ChatSessionDetailData>;
  
  //  新增: 用于管理流中断的控制器集合 Key: sessionId
  abortControllers: Map<number, AbortController>;
  
  //  新增: 记录哪些会话正在生成 (用于 UI 显示 loading 状态)
  generatingSessionIds: Set<number>;

  //  新增: 记录刚刚手动停止的会话 ID，用于修正后端可能返回的 completed 状态
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
    // 判断当前会话是否正在生成
    isCurrentGenerating: (state) => {
      const currentId = state.currentSession?.id || state.selectedSessionId;
      return currentId ? state.generatingSessionIds.has(currentId) : false;
    }
  },

  actions: {
    // 判断指定会话是否正在生成
    isGenerating(sessionId: number) {
      return this.generatingSessionIds.has(sessionId);
    },

    async fetchSessions() {
      // ... existing code ...
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
       // ... existing code ...
      this.loading = true;
      this.error = null;
      try {
        const result = await reqChatSessionCreate({ title });

        if (result.code === 201 && result.data) {
          const newSession = result.data;
          // 更新缓存
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

    async fetchSessionDetail(sessionId: number, forceUpdate = false): Promise<boolean> {
      if (!forceUpdate && this.currentSession?.id === sessionId && this.currentSession?.messages.length > 0) {
        return true;
      }
      this.selectedSessionId = sessionId;
      this.error = null;

      // 1.  如果缓存中有，优先使用缓存 (特别是正在生成的会话，绝对不能覆盖)
      if (!forceUpdate && this.sessionCache.has(sessionId)) {
        this.currentSession = this.sessionCache.get(sessionId)!;
        
        // 如果正在生成，直接返回，不再请求接口，以免打断前端状态
        if (this.generatingSessionIds.has(sessionId)) {
            return true;
        }
      }

      this.loading = true;
      try {
        const result = await reqChatSessionDetail(sessionId);

        if (result.code === 200 && result.data) {
          
          //  修复：如果该会话刚刚被手动停止，强制将最后一条 AI 消息状态设为 interrupted
          // 這是為了防止后端因为 buffering 等原因误判为 completed，导致前端“继续”按钮消失
          if (this.stoppingSessionIds.has(sessionId)) {
             const msgs = result.data.messages;
             if (msgs.length > 0) {
                 const lastMsg = msgs[msgs.length - 1];
                 if (lastMsg?.sender === 'ai' && lastMsg.status === 'completed') {
                     lastMsg.status = 'interrupted';
                 }
             }
             this.stoppingSessionIds.delete(sessionId);
          }

          // 更新缓存
          this.sessionCache.set(sessionId, result.data);
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
       // ... existing code ...
      if (!this.currentSession?.id) {
        this.error = "请先选择或创建一个会话。";
        return;
      }

      const sessionId = this.currentSession.id;

      // ... existing code ...
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
      
      // 确保 session 在缓存中
      if (!this.sessionCache.has(sessionId)) {
        this.sessionCache.set(sessionId, this.currentSession);
      }
      const cachedSession = this.sessionCache.get(sessionId)!;

      // 添加用户消息
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

      // AI 占位消息
      const tempId = (Date.now() * -1) - 1;
      cachedSession.messages.push({
        id: tempId,
        session: sessionId,
        sender: "ai",
        content: "",
        content_type: "markdown",
        created_at: new Date().toISOString(),
        reasoning_content: "",
        status: 'generating', // 初始状态为生成中
      });

      //  标记正在生成
      this.generatingSessionIds.add(sessionId);

      //  创建中断控制器
      const controller = new AbortController();
      this.abortControllers.set(sessionId, controller);

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
          signal: controller.signal, //  绑定信号
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
        // 调用通用的流处理函数
        await this.processStreamResponse(response, sessionId, tempId, false);

      } catch (err: any) {
        if (err.name === 'AbortError') {
           // 用户手动停止，不视为错误
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
        // 释放 URL
        tempFiles.forEach(f => URL.revokeObjectURL(f.file_url));
      }
    },
    
    // 停止生成
    stopGenerate(sessionId: number) {
      const controller = this.abortControllers.get(sessionId);
      if (controller) {
        controller.abort(); // 中断 fetch 请求
        this.abortControllers.delete(sessionId);
      }
      this.generatingSessionIds.delete(sessionId);
      
      //  标记此会话为手动停止，以便在 refresh 时修正状态
      this.stoppingSessionIds.add(sessionId);

      //  停止时也要重置状态
      if (this.currentSession?.id === sessionId) {
          this.regeneratingMessageId = null; 
      }
      
      //  修复 Issue 2 & 4: 停止后，等待一小段时间让后端完成保存，然后刷新会话
      setTimeout(() => {
        this.fetchSessionDetail(sessionId, true); // true = 强制刷新
      }, 500); 
    },

    //  继续生成 (追加模式)
    async continueGenerate(sessionId: number, model: string = 'deepseek-chat') {
      if (!sessionId) {
          console.error("continueGenerate: sessionId is missing");
          return;
      }
      const session = this.sessionCache.get(sessionId);
      if (!session || session.messages.length === 0) {
          console.warn("continueGenerate: Session cache missing or empty");
          return;
      }

      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage?.sender !== 'ai') return; // 只能继续 AI 的消息

      //  修复 Issue 4: 如果 ID 还是负数，说明没有同步，无法继续
      if (lastMessage.id < 0) {
          toast.warning("正在同步消息状态，请稍后再试...");
          // 尝试重新同步
          await this.fetchSessionDetail(sessionId, true);
          return;
      }

      this.generatingSessionIds.add(sessionId);
      //  设置 regeneratingMessageId，以便 UI 显示光标
      this.regeneratingMessageId = lastMessage.id;
      // 创建中断控制器
      const controller = new AbortController();
      this.abortControllers.set(sessionId, controller);

      try {
        // ... existing code ...
        const apiUrl = `/api/sessions/${sessionId}/regenerate/`;
        const headers: HeadersInit = { "Content-Type": "application/json" };
        const token = localStorage.getItem('TOKEN');
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ 
            message_id: lastMessage.id, 
            model,
            type:'continue' 
          }), // 告诉后端针对哪条消息
          signal: controller.signal, //  绑定信号
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

        await this.processStreamResponse(response, sessionId, lastMessage.id, true); // true = append mode

      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Generation stopped by user');
        } else {
          this.error = err.message;
        }
      } finally {
        this.generatingSessionIds.delete(sessionId);
        this.abortControllers.delete(sessionId);
        //  重置状态
        this.regeneratingMessageId = null;
      }
    },

    async regenerateMessage(messageId: number, model: string = 'deepseek-chat') {
        // 逻辑类似 sendMessage，但需要先清空内容
        if (!this.currentSession?.id) return;
        const sessionId = this.currentSession.id;
        
        // 确保使用缓存中的 Session，防止切换后引用丢失
        const session = this.sessionCache.get(sessionId);
        if (!session) return;

        const msgIndex = session.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;
        
        // 清空
        if(!session.messages[msgIndex]) return;
        session.messages[msgIndex].content = "";
        session.messages[msgIndex].reasoning_content = "";
        session.messages[msgIndex].status = "generating"; // 设置状态

        this.generatingSessionIds.add(sessionId);
        //  设置 regeneratingMessageId
        this.regeneratingMessageId = messageId;

        const controller = new AbortController();
        this.abortControllers.set(sessionId, controller);

        try {
            const response = await fetch(`/api/sessions/${sessionId}/regenerate/`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('TOKEN')}`
                },
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
                 session.messages[msgIndex].status = 'error';
            }
        } finally {
            this.generatingSessionIds.delete(sessionId);
            this.abortControllers.delete(sessionId);
            //  重置状态
            this.regeneratingMessageId = null;
        }
    },

     // 通用流处理函数 (关键：支持追加模式)
    async processStreamResponse(response: Response, sessionId: number, targetMessageId: number, appendMode: boolean) {
        const reader = response.body!.getReader();
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
                        
                        //  关键：从缓存中获取 Session，而不是 this.currentSession
                        // 这样即使切换了会话，这里依然能更新正确的对象
                        const session = this.sessionCache.get(sessionId);
                        if (!session) break; 

                        const msgIndex = session.messages.findIndex(m => m.id === targetMessageId);
                        if (msgIndex === -1) continue;
                        const targetMsg = session.messages[msgIndex];

                        if (data.event === 'done') {
                            // 完成时更新完整对象
                            // 如果是追加模式，我们需要合并内容，而不是替换
                            if (appendMode) {
                                // 如果是继续生成，更新元数据，但不覆盖内容（因为流已经追加了）
                                if (targetMsg) {
                                    targetMsg.status = 'completed'; // 标记完成
                                    // 如果后端返回了新的 ID 或其他字段，可以更新
                                    if (data.message && data.message.id) {
                                        targetMsg.id = data.message.id;
                                    }
                                }
                            } else {
                                session.messages.splice(msgIndex, 1, { ...data.message, reasoning_content: data.reasoning || "" });
                            }
                        } else if (data.type === 'reasoning') {
                             if (targetMsg) {
                                 if (!targetMsg.reasoning_content) targetMsg.reasoning_content = "";
                                 targetMsg.reasoning_content += data.content;
                             }
                        } else if (data.type === 'content') {
                             if (targetMsg) {
                                 targetMsg.content += data.content;
                             }
                        }
                    } catch (e) {}
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
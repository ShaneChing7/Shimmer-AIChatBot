// src/store/modules/model.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { reqCheckDeepSeekUsage } from '@/api/model'
import { toast } from 'vue-sonner' // 假设使用 vue-sonner 作为提示库，可替换为你项目中的提示库
import i18n from '@/i18n'

export const useModelStore = defineStore('model', () => {
  // ----------------State----------------
  // 从 localStorage 初始化 Key，确保刷新不丢失
  const apiKey = ref<string>(localStorage.getItem('deepseek_api_key') || '')
  
  // 余额信息
  const balance = ref<string>('0.00')
  const currency = ref<string>('CNY')
  const isAvailable = ref<boolean>(false)
  
  // 加载状态
  const isLoading = ref<boolean>(false)

  // ----------------Getters----------------
  const hasKey = computed(() => !!apiKey.value && apiKey.value.length > 0)
  const formattedBalance = computed(() => `${balance.value} ${currency.value}`)

  // ✅ 新增: 估算剩余 Token 数 (基于 DeepSeek-V3 价格估算)
  // 参考价格: 1元 ≈ 50万 Tokens (取输入输出的混合平均保守值)
  const estimatedTokens = computed(() => {
    const bal = parseFloat(balance.value)
    if (isNaN(bal) || bal <= 0) return '0'
    
    // 假设 1 CNY = 500,000 Tokens (保守估计)
    const tokens = bal * 500000
    
    if (tokens > 100000000) {
        return `${(tokens / 100000000).toFixed(2)}B` // 十亿
    } else if (tokens > 1000000) {
        return `${(tokens / 1000000).toFixed(2)}M` // 百万
    } else if (tokens > 1000) {
        return `${(tokens / 1000).toFixed(0)}k` // 千
    }
    return Math.floor(tokens).toString()
  })

  // ----------------Actions----------------
  
  /**
   * 设置并保存 API Key 到 localStorage
   */
  const setApiKey = (key: string) => {
    apiKey.value = key.trim()
    localStorage.setItem('deepseek_api_key', apiKey.value)
    
    // 如果清空了 Key，也重置余额信息
    if (!apiKey.value) {
      balance.value = '0.00'
      isAvailable.value = false
    }
  }

  /**
   * 检查余额和 Key 有效性
   * @param showToast 是否显示成功/失败提示
   */
  const refreshUsage = async (showToast = false) => {
    if (!apiKey.value) {
      if (showToast) toast.error('请先配置 API Key')
      return
    }

    try {
      isLoading.value = true
      const res = await reqCheckDeepSeekUsage({ api_key: apiKey.value })
      
      if (res.code === 200 && res.data) {
        isAvailable.value = res.data.is_available
        
        // 提取余额信息 (CNY)
        const cnyInfo = res.data.balance_infos.find(item => item.currency === 'CNY')
        if (cnyInfo) {
          balance.value = cnyInfo.total_balance
          currency.value = cnyInfo.currency
        } else if (res.data.balance_infos && res.data.balance_infos.length > 0) {
          // 如果没有 CNY，取第一个（做存在性校验）
          const firstInfo = res.data.balance_infos[0]
          if (firstInfo) {
            balance.value = firstInfo.total_balance ?? balance.value
            currency.value = firstInfo.currency ?? currency.value
          }
        }

        if (showToast) toast.success(i18n.global.t('settings.model.balanceRefreshed'))
      } else {
        if (showToast) toast.error(res.message || '获取余额失败')
      }
    } catch (error: any) {
      if (showToast){
        if(error.status == 400){
          toast.error(i18n.global.t('settings.model.apiExpired'))
        }
      }
      // 如果是 401 或 Key 无效错误，可以在这里考虑是否清空状态，但为了用户体验通常保留输入
    } finally {
      isLoading.value = false
    }
  }

  // 初始化：如果存在 Key，自动刷新一次余额
  const init = () => {
    if (apiKey.value) {
      refreshUsage(false)
    }
  }

  return {
    apiKey,
    balance,
    currency,
    isAvailable,
    isLoading,
    hasKey,
    formattedBalance,
    estimatedTokens,
    setApiKey,
    refreshUsage,
    init
  }
})

export default useModelStore
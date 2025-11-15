import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zhCN from '../locales/zh-CN.json'

// 从 localStorage 读取语言设置，如果没有则默认为 'zh-CN'
const defaultLocale = localStorage.getItem('lang') || 'zh-CN'

const i18n = createI18n({
  // 必须设置 legacy: false, 才能在 Composition API 中使用
  legacy: false, 

  // 设置默认语言
  locale: defaultLocale, 

  // 设置备用语言（当默认语言的翻译缺失时）
  fallbackLocale: 'en',

  // 加载语言包
  messages: {
    'en': en,
    'zh-CN': zhCN
  },

  // 静默处理翻译缺失（不打印警告）
  silentTranslationWarn: true,
  silentFallbackWarn: true
})

export default i18n
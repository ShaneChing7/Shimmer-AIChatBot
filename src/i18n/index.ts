import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

// 从 localStorage 读取语言设置，如果没有则默认为 'zh-CN'
const defaultLocale = localStorage.getItem('lang') || 'zh-CN'

const i18n = createI18n({
  // 必须设置 legacy: false, 才能在 Composition API 中使用
  legacy: false,

  // 设置默认语言
  locale: defaultLocale,

  // 设置备用语言（当默认语言的翻译缺失时）
  fallbackLocale: 'en',

  // 初始为空，语言包异步加载
  messages: {},

  // 静默处理翻译缺失（不打印警告）
  silentTranslationWarn: true,
  silentFallbackWarn: true
})

// 已加载的语言列表
const loadedLanguages: string[] = []

/**
 * 异步加载语言包
 * @param locale 语言代码
 */
export async function loadLocaleMessages(locale: string) {
  // 如果已经加载过，直接返回
  if (loadedLanguages.includes(locale)) {
    return nextTick()
  }

  // 动态导入语言包
  const messages = await import(`../locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLanguages.push(locale)

  return nextTick()
}

/**
 * 设置语言
 * @param locale 语言代码
 */
export async function setLocale(locale: string) {
  await loadLocaleMessages(locale)
  i18n.global.locale.value = locale
  localStorage.setItem('lang', locale)
}

// 初始加载默认语言
loadLocaleMessages(defaultLocale)

// 预加载备用语言（低优先级，使用 requestIdleCallback）
if (defaultLocale !== 'en' && typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => loadLocaleMessages('en'))
}

export default i18n
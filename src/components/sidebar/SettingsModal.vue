<template>
    <div v-if="visible" class="fixed inset-0 z-10 bg-black/10 backdrop-blur-md" @click="close"></div>

    <transition name="fade-scale">
        <div v-if="visible"
            class="fixed flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 top-1/2 left-1/2 z-50 w-full h-full max-h-[500px] max-w-[760px] rounded-[25px] -translate-x-1/2 -translate-y-1/2 shadow-lg">
            <div class="h-13 w-full flex items-center justify-between px-7 py-3">
                <div class="text-[18px] font-black">{{ t('settings.title')}}</div>
                <div class="p-1 cursor-pointer" @click="close">
                    <X :size="20"></X>
                </div>
            </div>
            <div class="relative h-full flex w-full p-3 pt-0 z-10">

                <div class="w-48 pr-3 flex flex-col">
                    <div v-for="item in menuItems" :key="item.id"
                        class="flex items-center mb-1 px-4 py-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[15px] text-left gap-3 cursor-pointer"
                        :class="activeTab === item.id ? 'bg-gray-100 dark:bg-gray-800 font-semibold' : ''"
                        @click="activeTab = item.id">
                        <component :is="item.icon" class="size-4" />
                        <span>{{ item.label }}</span>
                    </div>
                </div>

                <div class="flex-1 p-6 pt-0 overflow-auto">
                    <div v-if="activeTab === 'general'">
                        <div class="space-y-4">
                            <div class="flex flex-col justify-between">
                                <span class="text-sm font-medium mb-2">{{ t('settings.general.theme') }}</span>
                                <div class="h-25 flex justify-between items-center px-0">
                                    <div class="h-20 w-38 rounded-[10px] flex flex-col items-center justify-center 
                                                transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 border cursor-pointer
                                                "
                                        :class="{ ' bg-muted dark:bg-blue-950': currentTheme === 'light' }"
                                        @click="setTheme('light')">
                                        <Sun :size="18"></Sun>
                                        <span class="text-[14px]">{{ t('settings.general.light') }}</span>
                                    </div>
                                    <div class="h-20 w-38 rounded-[10px] flex flex-col items-center justify-center 
                                                transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 border cursor-pointer
                                                "
                                        :class="{ ' bg-blue-50 dark:bg-blue-950': currentTheme === 'dark' }"
                                        @click="setTheme('dark')">
                                        <Moon :size="18"></Moon>
                                        <span class="text-[14px]">{{ t('settings.general.dark') }}</span>
                                    </div>
                                    <div class="h-20 w-38 rounded-[10px] flex flex-col items-center justify-center 
                                                transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 border cursor-pointer
                                                "
                                        :class="{ ' bg-blue-50 dark:bg-blue-950': currentTheme === 'system' }"
                                        @click="setTheme('system')">
                                        <Monitor :size="18"></Monitor>
                                        <span class="text-[14px]">{{ t('settings.general.followSys') }}</span>
                                    </div>
                                </div>
                            </div>
                            <!-- 语言选择 -->
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium">{{ t('settings.general.lang') }}</span>
                                <div class="relative w-36">
                                    <div class="
                                            cursor-pointer border rounded-lg w-full
                                            px-4 py-2 
                                            bg-gray-50 dark:bg-gray-700 
                                            dark:border-gray-600 border-gray-300 
                                            flex items-center justify-between
                                            transition-all duration-200
                                            text-sm" 
                                            :class="{ ' text-gray-400': isDropdownOpen }"
                                            @click="isDropdownOpen = !isDropdownOpen"
                                            @mousedown.stop
                                    >
                                        <span>{{ selectedLangLabel }}</span>
                                        <ChevronDown class="size-4 transition-transform" :class="{ 'rotate-180': isDropdownOpen }" />
                                    </div>
                                    <!-- 下拉菜单 -->
                                    <transition name="dropdown-fade-slide">
                                        <div ref="dropdownRef" v-if="isDropdownOpen" class="absolute z-10 w-full mt-1 rounded-lg shadow-lg 
                                        bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                                        <!-- 遍历数组生成下拉菜单item -->
                                            <div v-for="lang in languageOptions" :key="lang.value"
                                                class="flex justify-between items-center px-3 py-2 cursor-pointer transition-colors duration-150 rounded-lg mx-1 my-1"
                                                :class="{
                                                    'bg-muted  dark:text-blue-100 font-semibold': selectedLang === lang.value,
                                                    'hover:bg-gray-100 dark:hover:bg-gray-600': selectedLang !== lang.value
                                                }"
                                                @click="selectLang(lang.value)"
                                            >
                                                {{ lang.label }}
                                                <div v-if="selectedLang == lang.value" >
                                                    <Check :size="20"></Check>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    </transition>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="activeTab === 'account'">
                        <p class="text-sm">账号管理内容</p>
                    </div>

                    <div v-else-if="activeTab === 'data'">
                        <p class="text-sm">数据管理内容</p>
                    </div>

                    <div v-else-if="activeTab === 'terms'">
                        <p class="text-sm">服务协议内容</p>
                    </div>


                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch,onUnmounted } from 'vue'
import { defineProps, defineEmits } from 'vue';
import { Settings, User, Database, FileText, X, Sun, Moon, Monitor, ChevronDown,Check } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

const { t,locale } = useI18n()
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();
// 语言选项数据
const languageOptions = [
    { value: 'zh-CN', label: '中文' },
    { value: 'en', label: 'English' },
];
// 下拉框状态
const selectedLang = ref(locale.value); // 默认选中中文
const isDropdownOpen = ref(false);
// ⚡️ 用于引用下拉组件根元素的 Ref ⚡️
const dropdownRef = ref<HTMLElement | null>(null); 
//选择框中的的文字（value->label)
const selectedLangLabel = computed(() => 
    languageOptions.find(opt => opt.value === selectedLang.value)?.label
);
// 将 vue-i18n 的 locale 映射到 dayjs 的 locale
// dayjs 的语言命名可能不同（例如 vue-i18n 用 'zh-CN', dayjs 用 'zh-cn'）
const mapLocale = (lang: string) => (lang === 'zh-CN' ? 'zh-cn' : 'en')
//选择语言触发的函数
const selectLang = (lang: string) => {
    locale.value = lang 
    localStorage.setItem('lang', lang)
    // <--- 关键同步步骤
    dayjs.locale(mapLocale(lang)) // 设置 DayJS 的全局 locale
    selectedLang.value = lang;
    isDropdownOpen.value = false; // 选中后关闭下拉框
};
// 确保组件初始化时 DayJS locale 是正确的
dayjs.locale(mapLocale(locale.value))
// 处理外部点击关闭下拉菜单 
// 全局点击处理函数
const handleClickOutside = (event: MouseEvent) => {
    // 检查点击事件的目标是否在下拉框的元素内部 (dropdownRef.value)
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        // 如果点击发生在外部，则关闭下拉框
        isDropdownOpen.value = false;
        // console.log('点击外部，关闭下拉菜单');
    }
};

// 监听 isDropdownOpen 状态的变化，动态添加/移除事件
watch(isDropdownOpen, (isOpen) => {
    if (isOpen) {
        // 使用 setTimeout 确保事件监听器在当前点击事件冒泡完成后才添加
        // 否则，它可能会立即捕获到打开下拉框的那次点击事件，然后又立即关闭它
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
    } else {
        document.removeEventListener('mousedown', handleClickOutside);
    }
});

onUnmounted(() => {
    // 组件卸载时，确保移除监听器，防止内存泄漏
    document.removeEventListener('mousedown', handleClickOutside);
});
const menuItems = computed(() => {
    return [
        { id: 'general', label: t('settings.menu.general'), icon: Settings },
        { id: 'account', label: t('settings.menu.account'), icon: User },
        { id: 'data', label: t('settings.menu.data'), icon: Database },
        { id: 'terms', label: t('settings.menu.terms'), icon: FileText },
    ]
});

const activeTab = ref('general');
// 从 localStorage 读取，若无则使用 'light' 作为默认值
const currentTheme = ref(localStorage.getItem('theme') || 'light');

const setTheme = (themeName: string) => {
    currentTheme.value = themeName;
    // 实际应用主题的逻辑通常会在这里调用一个函数，
    // 例如：document.documentElement.classList.remove('dark');
    //      if (themeName === 'dark') document.documentElement.classList.add('dark');
    //      或根据 system 主题监听 prefers-color-scheme
};

// 你可能希望在组件加载时从 localStorage 读取主题，或者在保存时存储主题。
watch(currentTheme, (newTheme) => {
    // 这里可以放置实际更新页面主题（如添加/移除 'dark' class到 html 标签）的逻辑
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    // 对于 'system'，你可能需要根据 prefers-color-scheme 来动态决定
    // 存储到 localStorage
    localStorage.setItem('theme', newTheme);
}, { immediate: true }); // immediate: true 确保组件加载时立即执行一次


const close = () => emit('update:visible', false);

</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.2s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.5);
}

/* 新增的自定义下拉过渡样式 */
.dropdown-fade-slide-enter-active,
.dropdown-fade-slide-leave-active {
    transition: all 0.2s ease-out;
    transform-origin: top;
}

.dropdown-fade-slide-enter-from,
.dropdown-fade-slide-leave-to {
    opacity: 0;
    transform: scaleY(0.8); /* 从顶部缩放进入/退出 */
}
</style>
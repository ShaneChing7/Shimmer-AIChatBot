<template>
    <div v-if="visible" class="fixed inset-0 z-10 bg-black/10 backdrop-blur-md" @click="close"></div>

    <transition name="fade-scale">
        <div v-if="visible"
            class="fixed flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 top-1/2 left-1/2 z-50 w-full h-full max-h-[550px] max-w-[800px] rounded-[25px] -translate-x-1/2 -translate-y-1/2 shadow-2xl border border-gray-100 dark:border-gray-800">
            
            <div class="h-14 w-full flex items-center justify-between px-7 py-4 border-b border-gray-100 dark:border-gray-800/50">
                <div class="text-[18px] font-black tracking-tight">{{ t('settings.title') || 'Settings' }}</div>
                <div class="p-1.5 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" @click="close">
                    <X :size="20" class="text-gray-500 dark:text-gray-400"></X>
                </div>
            </div>

            <div class="relative h-full flex w-full p-4 pt-4 z-10 overflow-hidden">

                <!-- 侧边栏菜单 -->
                <div class="w-52 pr-4 flex flex-col gap-1">
                    <div v-for="item in menuItems" :key="item.id"
                        class="flex items-center px-4 py-3 transition-all duration-200 rounded-[14px] text-left gap-3 cursor-pointer group"
                        :class="activeTab === item.id 
                            ? 'bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'"
                        @click="activeTab = item.id">
                        <component :is="item.icon" class="size-[18px] transition-colors" 
                            :class="activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-gray-700 dark:group-hover:text-gray-300'" />
                        <span class="text-[14px]">{{ item.label }}</span>
                    </div>
                </div>

                <!-- 内容区域 -->
                <div class="flex-1 pl-2 overflow-hidden h-full relative">
                    <div class="h-full overflow-y-auto pr-2 pb-4 custom-scrollbar">
                        
                        <!-- General Tab -->
                        <div v-if="activeTab === 'general'" class="space-y-6 animate-fade-in">
                            <!-- ... existing general content ... -->
                            <div class="space-y-4">
                                <div class="flex flex-col justify-between">
                                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 block">{{ t('settings.general.theme') || 'Appearance' }}</span>
                                    <div class="grid grid-cols-3 gap-3">
                                        <div class="h-20 rounded-xl flex flex-col items-center justify-center gap-2
                                                    transition-all duration-200 border cursor-pointer relative overflow-hidden"
                                            :class="currentTheme === 'light' 
                                                ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                                            @click="setTheme('light')">
                                            <Sun :size="20" :class="currentTheme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'"></Sun>
                                            <span class="text-xs font-medium" :class="currentTheme === 'light' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'">{{t('settings.general.light')}}</span>
                                        </div>
                                        <div class="h-20 rounded-xl flex flex-col items-center justify-center gap-2
                                                    transition-all duration-200 border cursor-pointer relative overflow-hidden"
                                            :class="currentTheme === 'dark' 
                                                ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                                            @click="setTheme('dark')">
                                            <Moon :size="20" :class="currentTheme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'"></Moon>
                                            <span class="text-xs font-medium" :class="currentTheme === 'dark' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'">{{t('settings.general.dark')}}</span>
                                        </div>
                                        <div class="h-20 rounded-xl flex flex-col items-center justify-center gap-2
                                                    transition-all duration-200 border cursor-pointer relative overflow-hidden"
                                            :class="currentTheme === 'system' 
                                                ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                                            @click="setTheme('system')">
                                            <Monitor :size="20" :class="currentTheme === 'system' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'"></Monitor>
                                            <span class="text-xs font-medium" :class="currentTheme === 'system' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'">{{ t('settings.general.followSys') }}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between pt-2">
                                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('settings.general.lang') || 'Language' }}</span>
                                    <div class="relative w-40">
                                        <div class="cursor-pointer border rounded-lg w-full px-3 py-2 
                                                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                                                    dark:border-gray-700 border-gray-200 
                                                    flex items-center justify-between transition-all duration-200 text-sm shadow-sm" 
                                            :class="{ 'ring-2 ring-blue-100 dark:ring-blue-900 border-blue-400': isDropdownOpen }"
                                            @click="isDropdownOpen = !isDropdownOpen"
                                            @mousedown.stop>
                                            <span class="truncate mr-2">{{ selectedLangLabel }}</span>
                                            <ChevronDown class="size-4 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': isDropdownOpen }" />
                                        </div>
                                        <transition name="dropdown-fade-slide">
                                            <div ref="dropdownRef" v-if="isDropdownOpen" 
                                                class="absolute z-20 w-full mt-1 rounded-lg shadow-xl 
                                                    bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 overflow-hidden">
                                                <div v-for="lang in languageOptions" :key="lang.value"
                                                    class="flex justify-between items-center px-3 py-2 cursor-pointer transition-colors duration-150 text-sm mx-1 rounded-md"
                                                    :class="{
                                                        'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium': selectedLang === lang.value,
                                                        'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300': selectedLang !== lang.value
                                                    }"
                                                    @click="selectLang(lang.value)">
                                                    <span>{{ lang.label }}</span>
                                                    <Check v-if="selectedLang == lang.value" :size="14" class="text-blue-600 dark:text-blue-400"></Check>
                                                </div>
                                            </div>
                                        </transition>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Account Tab -->
                        <div v-else-if="activeTab === 'account'" class="animate-fade-in space-y-6">
                            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 flex items-center gap-4 border border-gray-100 dark:border-gray-800">
                                
                                <!-- Avatar Upload Area -->
                                <div class="relative group cursor-pointer" @click="triggerAvatarUpload">
                                    <Avatar class="w-12 h-12 transition-opacity duration-200" 
                                            :class="{'opacity-50': isAvatarUploading}"
                                            :key="userStore.avatar">
                                        <AvatarImage :src="userStore.avatar" alt="avatar" class="object-cover"/>
                                        <AvatarFallback>{{ userStore.username[0] }}</AvatarFallback>
                                    </Avatar>
                                    
                                    <!-- Hover Icon (Camera) -->
                                    <div v-if="!isAvatarUploading" class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                                        <Camera :size="20" class="text-white drop-shadow-md" />
                                    </div>

                                    <!-- Loading Spinner -->
                                    <div v-else class="absolute inset-0 flex items-center justify-center">
                                        <div class="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></div>
                                    </div>
                                </div>

                                <!-- Hidden File Input -->
                                <input 
                                    type="file" 
                                    ref="fileInputRef" 
                                    class="hidden" 
                                    accept="image/png, image/jpeg, image/gif, image/webp" 
                                    @change="handleAvatarChange"
                                />

                                <div class="flex-1">
                                    <h3 class=" text-lg font-bold text-gray-900 dark:text-white">{{ userStore.username}}</h3>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">UID: {{userStore.uid}}</p>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <!-- Modify Password Button -->
                                <div @click="openPasswordModal"
                                    class="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                            <KeyRound :size="18" />
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-sm font-medium">{{ t('settings.account.password') }}</span>
                                            <span class="text-xs text-gray-500">{{ t('settings.account.passwordDesc') }}</span>
                                        </div>
                                    </div>
                                    <ChevronRight :size="16" class="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                </div>

                                <!-- Logout Button -->
                                <div @click="handleLogout"
                                    class="group flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30 mt-4">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                            <LogOut :size="18" />
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-sm font-medium text-red-600 dark:text-red-400">{{ t('settings.account.logout') }}</span>
                                            <span class="text-xs text-red-400/70">{{ t('settings.account.logoutDesc') }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Data Tab -->
                        <div v-else-if="activeTab === 'data'" class="animate-fade-in space-y-6">
                            <div class="space-y-2">
                                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">{{ t('settings.data.storage') }}</span>
                                <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <div class="p-4 flex items-center justify-between bg-white dark:bg-gray-800/30">
                                        <div class="flex items-center gap-3">
                                            <div class="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                                <DatabaseZap :size="18" class="text-gray-600 dark:text-gray-300"/>
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium">{{ t('settings.data.localCache') }}</div>
                                                <div class="text-xs text-gray-500">{{ t('settings.data.used') }}: 24.5 MB</div>
                                            </div>
                                        </div>
                                        <button class="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            {{ t('settings.data.clear') }}
                                        </button>
                                    </div>
                                    <div class="h-[1px] bg-gray-100 dark:bg-gray-700 w-full"></div>
                                    <div class="p-4 flex items-center justify-between bg-white dark:bg-gray-800/30">
                                        <div class="flex items-center gap-3">
                                            <div class="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                                <Download :size="18" class="text-gray-600 dark:text-gray-300"/>
                                            </div>
                                            <div>
                                                <div class="text-sm font-medium">{{ t('settings.data.export') }}</div>
                                                <div class="text-xs text-gray-500">{{ t('settings.data.exportDesc') }}</div>
                                            </div>
                                        </div>
                                        <button class="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            {{ t('settings.data.exportBtn') }}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-2 pt-2">
                                <span class="text-xs font-semibold text-red-400 dark:text-red-500 uppercase tracking-wider ml-1">{{ t('settings.data.dangerZone') }}</span>
                                <div class="border border-red-100 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10 rounded-xl p-4 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                            <ShieldAlert :size="18" />
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-red-700 dark:text-red-400">{{ t('settings.data.deleteAccount') }}</div>
                                            <div class="text-xs text-red-500/70 dark:text-red-400/60">{{ t('settings.data.deleteAccountDesc') }}</div>
                                        </div>
                                    </div>
                                    <!-- Delete Account Trigger -->
                                    <button @click="openDeleteAccountModal"
                                        class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-transparent border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                        {{ t('settings.data.deleteBtn') }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Terms Tab -->
                        <div v-else-if="activeTab === 'terms'" class="animate-fade-in h-full flex flex-col">
                            <!-- ... existing terms content ... -->
                            <div class="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 leading-relaxed custom-scrollbar">
                                <h3 class="text-gray-900 dark:text-gray-100 font-bold mb-2">{{t('settings.terms.serviceTitle')}}</h3>
                                <p class="mb-4">{{t('settings.terms.serviceContent')}}</p>
                                <h3 class="text-gray-900 dark:text-gray-100 font-bold mb-2">{{t('settings.terms.privacyTitle')}}</h3>
                                <p class="mb-4">{{t('settings.terms.privacyContent')}}</p>
                                <h3 class="text-gray-900 dark:text-gray-100 font-bold mb-2">{{t('settings.terms.userDataTitle')}}</h3>
                                <p class="mb-4">{{t('settings.terms.userDataContent')}}</p>
                                <h3 class="text-gray-900 dark:text-gray-100 font-bold mb-2">{{t('settings.terms.usageTitle')}}</h3>
                                <p class="mb-4">{{t('settings.terms.usageContent')}}</p>
                                <p class="text-xs text-gray-400 mt-8 text-center">{{t('settings.terms.lastUpdated')}}</p>
                            </div>
                        </div>

                    </div>

                    <!-- Password Change Modal Overlay -->
                    <div v-if="showPasswordModal" class="absolute inset-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                        <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 relative">
                            <div class="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="closePasswordModal">
                                <X :size="18" class="text-gray-400" />
                            </div>
                            <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">{{ t('settings.account.changePassword') || 'Change Password' }}</h3>
                            
                            <div class="space-y-3">
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-500">{{ t('settings.account.oldPassword') || 'Old Password' }}</label>
                                    <input v-model="passwordForm.old_password" type="password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-500">{{ t('settings.account.newPassword') || 'New Password' }}</label>
                                    <input v-model="passwordForm.new_password" type="password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs font-medium text-gray-500">{{ t('settings.account.confirmNewPassword') || 'Confirm New Password' }}</label>
                                    <input v-model="passwordForm.new_password2" type="password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all">
                                </div>
                            </div>
                            
                            <div class="mt-6 flex gap-3">
                                <button @click="closePasswordModal" class="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    {{ t('common.cancel') || 'Cancel' }}
                                </button>
                                <button @click="submitPasswordChange" :disabled="isLoading" 
                                    class="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                                    <span v-if="isLoading" class="animate-spin mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                    {{ t('common.save') || 'Save' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Delete Account Modal Overlay -->
                    <div v-if="showDeleteAccountModal" class="absolute inset-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                        <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-100 dark:border-red-900 p-6 relative">
                            <div class="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="closeDeleteAccountModal">
                                <X :size="18" class="text-gray-400" />
                            </div>
                            <div class="flex flex-col items-center text-center mb-4">
                                <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-3">
                                    <ShieldAlert class="text-red-600 dark:text-red-400" :size="24" />
                                </div>
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ t('settings.data.deleteAccount') || 'Delete Account' }}</h3>
                                <p class="text-xs text-gray-500 mt-1 max-w-[240px] leading-relaxed">
                                    {{ t('settings.data.deleteWarning') || 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.' }}
                                </p>
                            </div>
                            
                            <div class="space-y-4">
                                <div class="space-y-1 text-left">
                                    <label class="text-xs font-medium text-gray-500">{{ t('settings.account.password') || 'Password' }}</label>
                                    <input v-model="deleteAccountForm.password" type="password" placeholder="Verify your password" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-400 outline-none transition-all placeholder:text-gray-400">
                                </div>
                                <div class="space-y-1 text-left">
                                    <label class="text-xs font-medium text-gray-500">{{ t('settings.data.deleteConfirm') || 'Type "DELETE" to confirm' }}</label>
                                    <input v-model="deleteAccountForm.confirmation" type="text" placeholder="DELETE" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-400 outline-none transition-all placeholder:text-gray-400">
                                </div>
                            </div>
                            
                            <div class="mt-6 flex gap-3">
                                <button @click="closeDeleteAccountModal" class="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    {{ t('common.cancel') || 'Cancel' }}
                                </button>
                                <button @click="submitDeleteAccount" :disabled="isDeleteLoading || deleteAccountForm.confirmation !== 'DELETE'" 
                                    class="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                                    <span v-if="isDeleteLoading" class="animate-spin mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                    {{ t('settings.data.deleteBtn') || 'Delete' }}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ref, computed, watch, onUnmounted, reactive } from 'vue'
import { defineProps, defineEmits } from 'vue';
import { 
    Settings, User, Database, FileText, X, Sun, Moon, Monitor, 
    ChevronDown, Check, LogOut, KeyRound, UserPen, ChevronRight,
    Camera, DatabaseZap, Download, ShieldAlert
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
// 导入 Store
import useUserStore from '@/store/modules/user'
import { useChatStore } from "@/store/modules/chat";
import { toast } from 'vue-sonner';

const chatStore = useChatStore()
const userStore = useUserStore()

const { t, locale } = useI18n()
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();

// -------------------- 语言和主题逻辑 (保持不变) --------------------
const languageOptions = [
    { value: 'zh-CN', label: '中文' },
    { value: 'en', label: 'English' },
];

const selectedLang = ref(locale.value);
const isDropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null); 

const selectedLangLabel = computed(() => 
    languageOptions.find(opt => opt.value === selectedLang.value)?.label || 'Language'
);

const mapLocale = (lang: string) => (lang === 'zh-CN' ? 'zh-cn' : 'en')

const selectLang = (lang: string) => {
    locale.value = lang 
    localStorage.setItem('lang', lang)
    dayjs.locale(mapLocale(lang)) 
    selectedLang.value = lang;
    isDropdownOpen.value = false; 
};

dayjs.locale(mapLocale(locale.value))

const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isDropdownOpen.value = false;
    }
};

watch(isDropdownOpen, (isOpen) => {
    if (isOpen) {
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
    } else {
        document.removeEventListener('mousedown', handleClickOutside);
    }
});

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside);
});

// -------------------- 菜单逻辑 --------------------
const menuItems = computed(() => {
    return [
        { id: 'general', label: t('settings.menu.general') || 'General', icon: Settings },
        { id: 'account', label: t('settings.menu.account') || 'Account', icon: User },
        { id: 'data', label: t('settings.menu.data') || 'Data', icon: Database },
        { id: 'terms', label: t('settings.menu.terms') || 'About', icon: FileText },
    ]
});

const activeTab = ref('general');

// 关键逻辑：监听 activeTab 变化，切换 Tab 时关闭所有子模态框
watch(activeTab, () => {
    closePasswordModal();
    closeDeleteAccountModal();
});


const currentTheme = ref(localStorage.getItem('theme') || 'light');

const setTheme = (themeName: string) => {
    currentTheme.value = themeName;
};

watch(currentTheme, (newTheme) => {
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
        document.documentElement.classList.remove('dark');
    } else {
         document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
}, { immediate: true });

const close = () => {
    emit('update:visible', false);
    // 重置状态
    closePasswordModal();
    closeDeleteAccountModal();
};

// -------------------- 业务逻辑：上传头像 --------------------
const fileInputRef = ref<HTMLInputElement | null>(null);
const isAvatarUploading = ref(false);

// 触发文件选择
const triggerAvatarUpload = () => {
    if (isAvatarUploading.value) return;
    fileInputRef.value?.click();
};

// 处理文件变更
const handleAvatarChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if(!file) return

    // 1. 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast.error(t('settings.account.invalidImageType') || 'Only JPG, PNG, GIF, and WEBP files are allowed.');
        input.value = ''; // 清空选择
        return;
    }

    // 2. 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        toast.error(t('settings.account.imageTooLarge') || 'Image size must be less than 10MB.');
        input.value = ''; // 清空选择
        return;
    }

    try {
        isAvatarUploading.value = true;
        await userStore.userUploadAvatar({ avatar: file });
        // 成功后添加提示
        toast.success(t('settings.account.avatarUpdateSuccess') || 'Avatar updated successfully');
    } catch (error: any) {
        toast.error(error.message || t('settings.account.uploadFailed') || 'Failed to upload avatar.');
    } finally {
        isAvatarUploading.value = false;
        input.value = ''; // 清空选择，允许重复上传同一文件
    }
};

// -------------------- 业务逻辑：修改密码 --------------------
const showPasswordModal = ref(false);
const isLoading = ref(false);
const passwordForm = reactive({
    old_password: '',
    new_password: '',
    new_password2: ''
});

const openPasswordModal = () => {
    passwordForm.old_password = '';
    passwordForm.new_password = '';
    passwordForm.new_password2 = '';
    showPasswordModal.value = true;
};

const closePasswordModal = () => {
    showPasswordModal.value = false;
};

const submitPasswordChange = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password) {
        toast.error(t('settings.account.fillAllFields') || 'Please fill in all fields');
        return;
    }
    if (passwordForm.new_password !== passwordForm.new_password2) {
        toast.error(t('settings.account.passwordMismatch') || 'Passwords do not match');
        return;
    }

    try {
        isLoading.value = true;
        await userStore.userPasswordChange({
            old_password: passwordForm.old_password,
            new_password: passwordForm.new_password,
            new_password2: passwordForm.new_password2
        });
        toast.success(t('settings.account.changeSuccess') || 'Password changed successfully');
        closePasswordModal();
        // 可选：登出让用户重新登录
        await handleLogout();
    } catch (error: any) {
        toast.error(error.message || t('settings.account.changePasswordFailed') || 'Failed to change password');
    } finally {
        isLoading.value = false;
    }
};

// -------------------- 业务逻辑：注销账号 --------------------
const showDeleteAccountModal = ref(false);
const isDeleteLoading = ref(false);
const deleteAccountForm = reactive({
    password: '',
    confirmation: ''
});

const openDeleteAccountModal = () => {
    deleteAccountForm.password = '';
    deleteAccountForm.confirmation = '';
    showDeleteAccountModal.value = true;
};

const closeDeleteAccountModal = () => {
    showDeleteAccountModal.value = false;
};

const submitDeleteAccount = async () => {
    if (deleteAccountForm.confirmation !== 'DELETE') return;
    if (!deleteAccountForm.password) {
         toast.error(t('settings.account.enterPassword') || 'Please enter your password');
         return;
    }

    try {
        isDeleteLoading.value = true;
        await userStore.userAccountDelete({
            password: deleteAccountForm.password,
            confirmation: deleteAccountForm.confirmation
        });
        toast.success(t('settings.data.deleteSuccess') || 'Account deleted successfully. Goodbye.');
        closeDeleteAccountModal();
        close(); // Close settings modal
        // 路由跳转到登录页通常在 userLogout 中处理，或者在这里手动 router.push('/login')
        window.location.reload(); 
    } catch (error: any) {
        toast.error(error.message || t('settings.data.deleteFailed') || 'Failed to delete account');
    } finally {
        isDeleteLoading.value = false;
    }
};

// -------------------- 业务逻辑：登出 --------------------
const handleLogout = async () => {
    await userStore.userLogout();
    await chatStore.clearChatState();
    close();
}

</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.2s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.dropdown-fade-slide-enter-active,
.dropdown-fade-slide-leave-active {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top;
}

.dropdown-fade-slide-enter-from,
.dropdown-fade-slide-leave-to {
    opacity: 0;
    transform: scaleY(0.9) translateY(-5px);
}

/* 简单的淡入动画用于切换 Tab */
.animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 自定义滚动条，使其在不同浏览器中更美观且不突兀 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #374151;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #d1d5db;
}
</style>
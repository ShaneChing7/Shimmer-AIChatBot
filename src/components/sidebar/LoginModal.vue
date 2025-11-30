<template>
  <div v-if="visible" class="fixed inset-0 z-40 bg-black/10 backdrop-blur-md transition-opacity duration-300"
    @click="closeModal"></div>

  <transition name="fade-scale">
    <div v-if="visible" class="fixed flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 top-1/2 left-1/2 z-50 
              w-[90%] max-w-sm sm:max-w-md max-h-[600px] 
              rounded-[25px] -translate-x-1/2 -translate-y-1/2 shadow-2xl p-8 
              border border-gray-100 dark:border-gray-800
              transition-all duration-300 ease-out">
      
      <div class="flex justify-between items-center mb-8">
        <!-- Logo and Title Container -->
        <div class="flex items-center gap-3">
          <img src="/shimmer.svg" alt="Logo" class="w-8 h-8 object-contain" />
          
          <!-- 标题增加过渡动画 -->
          <Transition name="fade" mode="out-in">
            <h2 :key="isLoginMode ? 'login' : 'register'" class="text-2xl font-black tracking-tight">
                {{ isLoginMode ? t('auth.modalTitleLogin') : t('auth.modalTitleRegister') }}
            </h2>
          </Transition>
        </div>
        
        <div aria-label="close" :title="t('auth.close')" class="p-1.5 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          @click="closeModal" >
          <X :size="20" class="text-gray-500 dark:text-gray-400"></X>
        </div>
      </div>

      <!-- 表单区域：移除 space-y-5，改为手动控制 margin 以配合动画 -->
      <div class="flex flex-col">

        <div class="flex flex-col space-y-1.5 mb-5">
          <label for="username" class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{{ t('auth.usernameLabel') }}</label>
          <div class="relative">
            <input id="username" v-model="formData.username" type="text" :placeholder="t('auth.usernamePlaceholder')" 
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400" 
            :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': errors.username }" />
          </div>
          <p v-if="errors.username" class="text-xs text-red-500 ml-1">{{ errors.username }}</p>
        </div>

        <div class="flex flex-col space-y-1.5 mb-5">
          <label for="password" class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{{ t('auth.passwordLabel') }}</label>
            <div class="relative">
            <input id="password" v-model="formData.password" type="password" :placeholder="t('auth.passwordPlaceholder')" 
            class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
            :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': errors.password }" />
          </div>
          <p v-if="errors.password" class="text-xs text-red-500 ml-1">{{ errors.password }}</p>
        </div>

        <!-- 确认密码：增加折叠展开动画 -->
        <Transition name="expand">
          <div v-if="!isLoginMode" class="flex flex-col space-y-1.5 mb-5 overflow-hidden">
            <label for="confirmPassword" class="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{{ t('auth.confirmPasswordLabel') }}</label>
            <div class="relative">
              <input id="confirmPassword" v-model="formData.password2" type="password" :placeholder="t('auth.confirmPasswordPlaceholder')"
              class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-100': errors.confirmPassword }" />
            </div>
            <p v-if="errors.confirmPassword" class="text-xs text-red-500 ml-1">{{ errors.confirmPassword }}</p>
          </div>
        </Transition>

      </div>

      <div class="mt-3 flex flex-col items-center gap-4">
        <button @click="handleSubmit" :disabled="isLoading" 
            class="flex justify-center items-center w-full py-3 rounded-xl font-bold transition-all duration-200 
                  text-white bg-black active:scale-[0.98]
                  shadow-lg shadow-blue-500/20
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100">
          
          <!-- 按钮文字增加过渡动画 -->
          <Transition name="fade" mode="out-in">
            <span v-if="isLoading" key="loading" class="flex items-center justify-center">
              <Loader2 :size="20" class="animate-spin mr-2" />
              {{ t('auth.processing') }}
            </span>
            <span v-else :key="isLoginMode ? 'login-btn' : 'register-btn'">
              {{ isLoginMode ? t('auth.loginNow') : t('auth.registerNow') }}
            </span>
          </Transition>
        </button>

        <div class="text-sm text-center">
          <!-- 底部提示文字增加过渡动画 -->
          <Transition name="fade" mode="out-in">
            <span :key="isLoginMode ? 'q-login' : 'q-register'" class="text-gray-500 dark:text-gray-400">
              {{ isLoginMode ? t('auth.noAccountQuestion') : t('auth.haveAccountQuestion') }}
            </span>
          </Transition>
          <button type="button" @click="toggleMode"
            class="cursor-pointer ml-1 text-black dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors">
              <Transition name="fade" mode="out-in">
                <span :key="isLoginMode ? 'go-reg' : 'go-log'">
                  {{ isLoginMode ? t('auth.goToRegister') : t('auth.goToLogin') }}
                </span>
              </Transition>
          </button>
        </div>
      </div>

    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, reactive, watch } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import type { LoginFormData, RegisterFormData } from '@/api/user/type';
// 假设您已经引入了您的用户 Store
import useUserStore from '@/store/modules/user'; 
import { useChatStore } from '@/store/modules/chat';
// 引入 vue-sonner 的 toast 函数
import { toast } from 'vue-sonner';
const { t } = useI18n()
const userStore = useUserStore();
const chatStore = useChatStore()
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>();

// 状态管理
const isLoginMode = ref(true); // true: 登录, false: 注册
const isLoading = ref(false); // 提交加载状态

const formData = reactive<RegisterFormData>({
  username: '',
  password: '',
  password2: '',
});

const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

// 模态框关闭函数
const closeModal = () => {
  emit('update:visible', false);
};

// 模式切换函数
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
};

// 校验函数
const validateForm = (): boolean => {
  // 清空之前的错误
  errors.username = '';
  errors.password = '';
  errors.confirmPassword = '';

  let isValid = true;

  // 1. 用户名校验
  if (formData.username.length < 3 || formData.username.length > 20) {
    errors.username = t('auth.usernameLengthError');
    isValid = false;
  }

  // 2. 密码校验
  if (formData.password.length < 6) {
    errors.password = t('auth.passwordLengthError');
    isValid = false;
  }

  // 3. 确认密码校验 (仅在注册模式下)
  if (!isLoginMode.value) {
    if (formData.password2 === '') {
      errors.confirmPassword = t('auth.confirmPasswordEmpty');
      isValid = false;
    } else if (formData.password2 !== formData.password) {
      errors.confirmPassword = t('auth.confirmPasswordMismatch')
      isValid = false;
    }
  }

  return isValid;
};

// 重置表单和错误状态
const resetForm = () => {
  formData.username = '';
  formData.password = '';
  formData.password2 = '';
  errors.username = '';
  errors.password = '';
  errors.confirmPassword = '';
};


// 提交处理函数
const handleSubmit = async () => {
  if (!validateForm()) {
    // 校验失败，直接返回
    return;
  }

  isLoading.value = true;

  // 模拟 API 请求
  try {

    if (isLoginMode.value) {
      await userStore.userLogin(formData);
      closeModal(); // 成功后关闭模态框
      toast.success(t('auth.loginSuccess', { username: formData.username }));
      await userStore.userInfo()
      await chatStore.fetchSessions()
      
    } else {
      await userStore.userRegister(formData);
      toast.success(t('auth.registerSuccess'));
      isLoginMode.value = true
    }

    
  } catch (error) {
    console.error('API Error:', error);
    // 实际处理错误，例如显示错误信息
    toast.error(isLoginMode.value ? t('auth.loginFailed') : t('auth.registerFailed'));
    
  } finally {
    isLoading.value = false;
  }
};

// 监听 visible 和 isLoginMode 的变化来重置表单和错误状态
watch([() => props.visible, isLoginMode], ([newVisible]) => {
  // 在模态框打开或者模式切换时重置表单
  if (newVisible || !newVisible) {
    resetForm();
  }
  // 模态框关闭时，确保回到登录模式
  if (!newVisible) {
    isLoginMode.value = true;
  }
});
</script>

<style scoped>
/* 模态框本身的过渡 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 新增：输入框折叠动画 (Expand)
  结合了 max-height 和 margin-bottom 的动画，确保布局平滑
*/
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 100px; /* 设定一个足够大的值 */
  opacity: 1;
  margin-bottom: 1.25rem; /* 对应 mb-5 */
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
  transform: translateY(-10px);
}

/* 新增：文字淡入淡出 (Fade)
  用于标题和按钮文字的平滑切换
*/
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
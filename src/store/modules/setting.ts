import { defineStore } from 'pinia'

const useLayoutSettingStore = defineStore('SettingStore', {
	state: () => {
		return {
			isFold: false,
			refresh: false,
			isDark: false,
		}
	},
	actions: {},
	getters: {},
})

export default useLayoutSettingStore

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShellStore = defineStore('shell', () => {
  const navigationOpen = ref(typeof window === 'undefined' || window.innerWidth >= 1280)
  function toggleNavigation() { navigationOpen.value = !navigationOpen.value }
  return { navigationOpen, toggleNavigation }
})

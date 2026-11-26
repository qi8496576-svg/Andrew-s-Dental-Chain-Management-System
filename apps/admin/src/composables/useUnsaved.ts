import { onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/** Keep clinical drafts in memory; never persist sensitive form contents. */
export function useUnsaved(dirty: () => boolean, pending: () => boolean = () => false) {
  function canLeave() {
    if (pending()) { window.alert('办理结果确认中，请先重新确认办理结果。'); return false }
    return !dirty() || window.confirm('有尚未保存的修改，确认放弃并离开？')
  }
  function beforeUnload(event: BeforeUnloadEvent) { if (dirty() || pending()) { event.preventDefault(); event.returnValue = '' } }
  window.addEventListener('beforeunload', beforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  onBeforeRouteLeave(canLeave)
  return canLeave
}

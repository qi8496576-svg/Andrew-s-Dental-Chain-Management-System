<script setup lang="ts">
import { watch, nextTick, onBeforeUnmount, ref } from 'vue'
const props=defineProps<{open:boolean;title:string}>()
const emit=defineEmits<{close:[]}>()
const panel=ref<HTMLElement>(),previous=ref<HTMLElement|null>(null)
function key(event:KeyboardEvent){
 if(event.key==='Escape'){event.preventDefault();emit('close')}
 if(event.key==='Tab' && panel.value){const items=[...panel.value.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(e=>e.offsetParent!==null);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
}
watch(()=>props.open,async value=>{if(value){previous.value=document.activeElement as HTMLElement;await nextTick();panel.value?.querySelector<HTMLElement>('button')?.focus();document.addEventListener('keydown',key)}else{document.removeEventListener('keydown',key);previous.value?.focus()}})
onBeforeUnmount(()=>document.removeEventListener('keydown',key))
</script>
<template><Teleport to="body"><div v-if="open" class="workspace-overlay" @click.self="emit('close')"><section ref="panel" class="workspace-panel" role="dialog" aria-modal="true" :aria-label="title"><header class="page-heading"><h2>{{title}}</h2><button type="button" aria-label="关闭面板" @click="emit('close')">✕</button></header><slot/></section></div></Teleport></template>

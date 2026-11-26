<script setup lang="ts">
defineProps<{to:string}>()
const paths:Record<string,string>={
 '/appointment-booking':'M8 3v4m8-4v4M4 10h16M5 5h14v16H5zM8 14h3v3H8',
 '/schedules':'M4 4h16v16H4zM4 9h16M9 9v11M14 9v11',
 '/patients':'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m-6 10v-3a6 6 0 0 1 12 0v3m2-17a4 4 0 0 1 0 8m2 9v-4a5 5 0 0 0-2-4',
 '/patient-bindings':'m9 15 6-6M7 13l-2 2a4 4 0 0 0 6 6l3-3M10 6l3-3a4 4 0 0 1 6 6l-2 2',
 '/clinical-treatment':'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
 '/invoicing':'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h3',
 '/invoice-sources':'M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h6',
 '/treatment-price-correction':'M15 5H8a4 4 0 0 0 0 8h7a3 3 0 0 1 0 6H7m5-17v20',
 '/analytics':'M4 3v17h17M8 16v-5m5 5V6m5 10V9',
 '/cost-entries':'M4 6h16v14H4zM4 6V3h13M15 11h6v5h-6z',
 '/quarterly-performance':'M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5M12 14v7m-5 0h10',
}
</script>
<template><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[to] || 'M4 4h16v16H4zM8 9h8M8 14h5'"/></svg></template>

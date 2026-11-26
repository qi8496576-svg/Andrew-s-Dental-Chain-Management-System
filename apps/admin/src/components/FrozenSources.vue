<script setup lang="ts">
import {computed} from 'vue'
const props=defineProps<{snapshot:unknown}>()
const input=computed(()=>((props.snapshot as {input?:Record<string,unknown>})?.input??{}))
function rows(key:string){return (Array.isArray(input.value[key])?input.value[key]:[]) as Record<string,unknown>[]}
const tables=[{key:'revenue',title:'收入来源 · 开具时快照',columns:[['item','费用明细'],['dentist','实施牙医'],['clinic','诊所'],['issued','开具时间'],['amount','金额']]},{key:'costs',title:'已确认成本来源',columns:[['source','原始来源'],['dentist','归属牙医'],['clinic','诊所'],['type','类型'],['incurred','发生时间'],['amount','金额']]},{key:'schedules',title:'排班分摊依据',columns:[['dentist','牙医'],['clinic','诊所'],['date','日期'],['start','开始'],['end','结束'],['status','状态']]}]
function display(value:unknown){if(value===null||value===undefined)return '公共 / 未提供';return ({MEDICAL_SUPPLY:'医疗用品',OPERATING:'运营费用',NORMAL:'正常出诊',SUSPENDED:'已停诊'} as Record<string,string>)[String(value)]??String(value)}
</script>
<template><section v-for="table in tables" :key="table.key"><h3>{{table.title}}</h3><div class="table-scroll"><table><thead><tr><th v-for="col in table.columns" :key="col[0]">{{col[1]}}</th></tr></thead><tbody><tr v-for="(row,i) in rows(table.key)" :key="i"><td v-for="col in table.columns" :key="col[0]">{{display(row[col[0]!])}}</td></tr></tbody></table></div><p v-if="!rows(table.key).length" class="empty-state">该冻结快照中暂无此类来源。</p></section><details><summary>完整冻结记录与技术标识</summary><pre>{{JSON.stringify(snapshot,null,2)}}</pre></details></template>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { shanghaiToday } from '../views/schedules/week'
export const useViewScope=defineStore('view-scope',()=>{
 const clinic=ref(''),date=ref(shanghaiToday()),today=ref(shanghaiToday())
 function refreshDay(){const value=shanghaiToday();if(value!==today.value){if(date.value===today.value)date.value=value;today.value=value}}
 return {clinic,date,today,refreshDay}
})

import {expect,it} from 'vitest'
import {createMemoryHistory} from 'vue-router'
import {createAppRouter} from '../../router'
it('permits scoped billing readers in either cashier or headquarters role',async()=>{
 for(const role of ['CASHIER','HEADQUARTERS']){const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(r,c)=>r===role&&c==='billing.read'});await router.push('/patient-bills');expect(router.currentRoute.value.name).toBe('patient-bills')}
},20000)
it('does not give billing access merely because a user reads invoices or resources',async()=>{
 const router=createAppRouter(createMemoryHistory(),{ensure:async()=>true,canAccess:(_,c)=>['getInvoice','resource.read'].includes(c)});await router.push('/patient-bills');expect(router.currentRoute.value.name).toBe('home')
})

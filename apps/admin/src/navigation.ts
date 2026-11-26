export interface NavigationItem { label: string; to: string; role: string; capabilities: string[]; roles?:string[] }
export interface NavigationGroup { label: string; items: NavigationItem[] }
const item = (label: string, to: string, role: string, ...capabilities: string[]): NavigationItem => ({ label, to, role, capabilities })
const groups: NavigationGroup[] = [
 {label:'诊所业务',items:[
 item('预约管理','/appointment-booking','RECEPTION','listAppointments'),
 item('出诊排班','/schedules','RECEPTION','listSchedules'),
 item('患者资料','/patients','RECEPTION','getPatient','createPatient'),
 item('患者身份绑定','/patient-bindings','RECEPTION','listBindingRequests')]},
 {label:'诊疗与费用',items:[
 item('医生工作台','/clinical-treatment','DENTIST','getClinicalContext'),
 {...item('费用与缴费','/patient-bills','CASHIER','billing.read'),roles:['CASHIER','HEADQUARTERS']},
 item('费用凭据','/invoicing','CASHIER','invoiceAppointment','getInvoice'),
 item('费用凭据查阅','/invoice-sources','HEADQUARTERS','getInvoice'),
]},
 {label:'经营管理',items:[
 item('运营分析','/analytics','HEADQUARTERS','analysis.read'),
 item('季度成本核验','/cost-entries','HEADQUARTERS','cost.verify'),
 item('季度个人绩效','/quarterly-performance','HEADQUARTERS','cost.verify','performance.calculate','performance.publish','analysis.read')]},
]
export function navigationFor(can: (role: string, capability: string) => boolean): NavigationGroup[] {
 return groups.map(group=>({...group,items:group.items.filter(item=>(item.roles??[item.role]).some(role=>item.capabilities.some(cap=>can(role,cap))))})).filter(group=>group.items.length)
}


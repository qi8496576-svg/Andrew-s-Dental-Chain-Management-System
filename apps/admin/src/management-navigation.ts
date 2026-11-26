import type { ResourceName } from './views/organization-resources/resource-fields'
export const resourcePages:Record<ResourceName,{title:string;description:string}>={
 clinics:{title:'诊所管理',description:'维护门店通信资料和启用状态；新门店需单独配置人员权限。'},
 dentists:{title:'医生与执业资质',description:'维护牙医资料、证书核验和诊所执业关系，为排班与诊疗提供依据。'},
 treatments:{title:'治疗项目与价格目录',description:'维护服务项目、默认单价和必需资质，保留历史治疗价格。'},
 qualifications:{title:'专业资质目录',description:'维护资格目录，供牙医证书及治疗项目要求关联。'},
 allergies:{title:'过敏与服务基础资料',description:'维护共享过敏目录；患者实际过敏记录另行核验。'},
}
export function resourcePath(kind:ResourceName){return `/settings/${kind}`}
export function resourceKind(value: unknown): ResourceName {
  return typeof value==='string'&&Object.hasOwn(resourcePages,value)?value as ResourceName:'clinics'
}
export function managementEntries(can: (role: string, capability: string) => boolean) {
  const entries: {label:string;to:string;group:string;description:string}[] = []
  if (['resource.read','resource.write'].some(cap => can('HEADQUARTERS',cap)))
    entries.push(...Object.entries(resourcePages).map(([kind,page])=>({label:page.title,to:resourcePath(kind as ResourceName),group:'基础配置',description:page.description})))
  if (can('HEADQUARTERS','account.manage')) entries.push({label:'员工账号与密码',to:'/staff-accounts',group:'人员与权限',description:'建立员工账号、启停和经身份核验的密码管理。'})
  if (can('HEADQUARTERS','authorization.manage')) entries.push({label:'角色、岗位与诊所授权',to:'/clinic-grants',group:'人员与权限',description:'配置既定岗位、操作能力、诊所范围及授权有效期。'})
  return entries
}

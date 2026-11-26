export type ResourceName='clinics'|'dentists'|'qualifications'|'treatments'|'allergies'
export interface ResourceField {name:string;label:string;kind:'text'|'date'|'decimal'|'boolean';nullable:boolean;required:boolean;maximum?:number;pattern?:string}
export interface ResourceDefinition {title:string;id:string;fields:ResourceField[]}
// Input controls reflect approved schema fields; server validation remains authoritative.
export const resourceDefinitions:Record<ResourceName,ResourceDefinition>={
  "clinics": {
    "title": "诊所",
    "id": "clinic_id",
    "fields": [
      {
        "name": "clinic_code",
        "label": "诊所代码",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 20
      },
      {
        "name": "postal_address",
        "label": "通信地址",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 255
      },
      {
        "name": "manager_name",
        "label": "负责人",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 100
      },
      {
        "name": "phone",
        "label": "联系电话",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 30
      },
      {
        "name": "email",
        "label": "邮箱",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 254
      },
      {
        "name": "office_area_sqm",
        "label": "办公面积（平方米）",
        "kind": "decimal",
        "nullable": true,
        "required": false,
        "pattern": "^-?[0-9]{1,6}\\.[0-9]{2}$"
      },
      {
        "name": "is_active",
        "label": "启用",
        "kind": "boolean",
        "nullable": false,
        "required": true
      }
    ]
  },
  "dentists": {
    "title": "牙医",
    "id": "dentist_id",
    "fields": [
      {
        "name": "employee_number",
        "label": "员工编号",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 30
      },
      {
        "name": "full_name",
        "label": "姓名",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 100
      },
      {
        "name": "date_of_birth",
        "label": "出生日期",
        "kind": "date",
        "nullable": false,
        "required": true
      },
      {
        "name": "home_address",
        "label": "家庭地址",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 255
      },
      {
        "name": "phone",
        "label": "联系电话",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 30
      },
      {
        "name": "email",
        "label": "邮箱",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 254
      },
      {
        "name": "hire_date",
        "label": "入职日期",
        "kind": "date",
        "nullable": false,
        "required": true
      },
      {
        "name": "is_active",
        "label": "启用",
        "kind": "boolean",
        "nullable": false,
        "required": true
      },
      {
        "name": "termination_date",
        "label": "离职日期",
        "kind": "date",
        "nullable": true,
        "required": false
      },
      {
        "name": "professional_title",
        "label": "职称",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 40
      },
      {
        "name": "specialty",
        "label": "擅长与主要方向",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 255
      },
      {
        "name": "introduction",
        "label": "医生简介",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 1000
      }
    ]
  },
  "qualifications": {
    "title": "专业资质",
    "id": "qualification_id",
    "fields": [
      {
        "name": "qualification_name",
        "label": "资质名称",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 120
      },
      {
        "name": "description",
        "label": "说明",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 255
      },
      {
        "name": "is_active",
        "label": "启用",
        "kind": "boolean",
        "nullable": false,
        "required": true
      }
    ]
  },
  "treatments": {
    "title": "治疗项目",
    "id": "treatment_id",
    "fields": [
      {
        "name": "treatment_code",
        "label": "治疗代码",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 30
      },
      {
        "name": "treatment_name",
        "label": "治疗名称",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 120
      },
      {
        "name": "description",
        "label": "说明",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 255
      },
      {
        "name": "default_unit_price",
        "label": "默认单位价格",
        "kind": "decimal",
        "nullable": false,
        "required": true,
        "pattern": "^[0-9]{1,10}\\.[0-9]{2}$"
      },
      {
        "name": "is_active",
        "label": "启用",
        "kind": "boolean",
        "nullable": false,
        "required": true
      }
    ]
  },
  "allergies": {
    "title": "过敏目录项",
    "id": "allergy_id",
    "fields": [
      {
        "name": "allergy_name",
        "label": "过敏症名称",
        "kind": "text",
        "nullable": false,
        "required": true,
        "maximum": 100
      },
      {
        "name": "description",
        "label": "说明",
        "kind": "text",
        "nullable": true,
        "required": false,
        "maximum": 255
      },
      {
        "name": "is_active",
        "label": "启用",
        "kind": "boolean",
        "nullable": false,
        "required": true
      }
    ]
  }
}

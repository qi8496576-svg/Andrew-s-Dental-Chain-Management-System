// Generated from frozen ADC OpenAPI. Source SHA-256: 8da409373e97b51089ee6cceb01b1121e5c5d90d4e8987ab2242a39d0747f3da
// Do not edit; use npm run generate after approved source changes.
export interface paths {
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 只初始化CSRF，不授业务身份；禁止缓存
         * @description 只初始化CSRF，不授业务身份；禁止缓存；权限：匿名技术上下文
         */
        get: operations["initializeWebCsrf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/wechat-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * code2Session失败不建会话，不自动绑定患者
         * @description code2Session失败不建会话，不自动绑定患者；权限：微信真实代码交换
         */
        post: operations["createWechatSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/staff-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Web成功Set-Cookie并轮换CSRF；5错限15分钟
         * @description Web成功Set-Cookie并轮换CSRF；5错限15分钟；权限：个人账号及预认证CSRF
         */
        post: operations["createStaffSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * 注销当前会话；下一受保护请求拒绝
         * @description 注销当前会话；下一受保护请求拒绝；权限：有效会话
         */
        delete: operations["logout"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 只读自身可信上下文，不能覆盖角色范围
         * @description 只读自身可信上下文，不能覆盖角色范围；权限：当前主体
         */
        get: operations["getCurrentIdentity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/binding-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 仅申请，不自动取得档案
         * @description 仅申请，不自动取得档案；权限：已登录患者
         */
        post: operations["requestPatientBinding"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/binding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 只查当前本人绑定，未绑定404
         * @description 只查当前本人绑定，未绑定404；权限：已登录患者
         */
        get: operations["getPatientBinding"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/binding-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 按前台服务依据过滤申请
         * @description 按前台服务依据过滤申请；权限：授权前台核验范围
         */
        get: operations["listBindingRequests"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/binding-requests/{requestId}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 核实本人及双向当前唯一；冲突409不覆盖
         * @description 核实本人及双向当前唯一；冲突409不覆盖；权限：授权前台核验
         */
        post: operations["approvePatientBinding"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bindings/{subjectId}/rebind": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 原子旧失效新有效及审计，旧会话失去本人依据
         * @description 原子旧失效新有效及审计，旧会话失去本人依据；权限：授权前台人工核验
         */
        post: operations["rebindPatient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bindings/{subjectId}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 解绑保留核验历史和原因，撤销旧本人访问依据
         * @description 解绑保留核验历史和原因，撤销旧本人访问依据；权限：授权前台人工核验
         */
        post: operations["revokePatientBinding"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/staff-accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 仅账号管理者读取必要账号信息，无密码/令牌
         * @description 仅账号管理者读取必要账号信息，无密码/令牌；权限：HQ account.manage
         */
        get: operations["listStaffAccounts"];
        put?: never;
        /**
         * 创建/关联不自动授权，非牙医不写Dentist
         * @description 创建/关联不自动授权，非牙医不写Dentist；权限：HQ account.manage
         */
        post: operations["createStaffAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/staff-accounts/{subjectId}/activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 核实后办理；停用/恢复撤销旧会话，凭据不入回执日志
         * @description 核实后办理；停用/恢复撤销旧会话，凭据不入回执日志；权限：HQ account.manage
         */
        post: operations["activateStaffAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/staff-accounts/{subjectId}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 核实后办理；停用/恢复撤销旧会话，凭据不入回执日志
         * @description 核实后办理；停用/恢复撤销旧会话，凭据不入回执日志；权限：HQ account.manage
         */
        post: operations["deactivateStaffAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/staff-accounts/{subjectId}/credential-recovery": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 核实后办理；停用/恢复撤销旧会话，凭据不入回执日志
         * @description 核实后办理；停用/恢复撤销旧会话，凭据不入回执日志；权限：HQ account.manage
         */
        post: operations["credentialrecoveryStaffAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/grants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 只读自身有权管理的授权，不扩大诊所范围
         * @description 只读自身有权管理的授权，不扩大诊所范围；权限：HQ authorization.manage及可授范围
         */
        get: operations["listClinicGrants"];
        put?: never;
        /**
         * 仅在自身可授范围配置岗位/诊所/期限
         * @description 仅在自身可授范围配置岗位/诊所/期限；权限：HQ authorization.manage
         */
        post: operations["createClinicGrant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/identity/grants/{grantId}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 下一受保护请求拒绝旧范围
         * @description 下一受保护请求拒绝旧范围；权限：HQ authorization.manage
         */
        post: operations["revokeClinicGrant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/requests/{requestKey}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 超时原键查询；回执不绕过撤权，只返有权对象引用
         * @description 超时原键查询；回执不绕过撤权，只返有权对象引用；权限：原主体及原操作当前权限
         */
        get: operations["getRequestResult"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointment-candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 全部必需资质/执业/NORMAL/占位满足，提交仍复核
         * @description 全部必需资质/执业/NORMAL/占位满足，提交仍复核；权限：患者/授权前台 已登录未建档患者可只读检索真实候选；不因此取得患者资料或占位。
         */
        get: operations["searchAppointmentCandidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 参数不扩大可信范围
         * @description 参数不扩大可信范围；权限：本人或岗位诊所对象范围
         */
        get: operations["listAppointments"];
        put?: never;
        /**
         * 原子预约/期望治疗/BOOK/审计/回执，同键复用
         * @description 原子预约/期望治疗/BOOK/审计/回执，同键复用；权限：本人绑定患者/核验代办前台
         */
        post: operations["createAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 五状态投影，临床风险/收费所需字段分别控制
         * @description 五状态投影，临床风险/收费所需字段分别控制；权限：本人或获授权岗位对象
         */
        get: operations["getAppointment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/attend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * NORMAL且SCHEDULED核实本人，原子ATTEND
         * @description NORMAL且SCHEDULED核实本人，原子ATTEND；权限：授权前台
         */
        post: operations["attendAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 自助开始前NORMAL；开始后至结束前仅前台；结束转S4/停诊转S5
         * @description 自助开始前NORMAL；开始后至结束前仅前台；结束转S4/停诊转S5；权限：本人患者/授权前台
         */
        post: operations["cancelAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/no-show": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 时隙结束核实未到诊，NO_SHOW为分类，不覆盖到诊
         * @description 时隙结束核实未到诊，NO_SHOW为分类，不覆盖到诊；权限：授权前台
         */
        post: operations["markNoShow"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/reschedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 停诊旧约，旧新/来源/两端事件原子，失败保留待处理
         * @description 停诊旧约，旧新/来源/两端事件原子，失败保留待处理；权限：授权前台
         */
        post: operations["rescheduleAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 进行中且有有效项目，原子COMPLETE
         * @description 进行中且有有效项目，原子COMPLETE；权限：获授权牙医
         */
        post: operations["completeAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/invoice": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 已完成有效诊疗唯一开票，重复原单，不处理付款
         * @description 已完成有效诊疗唯一开票，重复原单，不处理付款；权限：授权诊所收费
         */
        post: operations["invoiceAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/schedules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 按授权范围读取
         * @description 按授权范围读取；权限：授权前台/总部资源
         */
        get: operations["listSchedules"];
        put?: never;
        /**
         * 稳定Dentist锁内校验跨诊所NORMAL不重叠及粒度
         * @description 稳定Dentist锁内校验跨诊所NORMAL不重叠及粒度；权限：授权前台
         */
        post: operations["createSchedule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/schedules/{scheduleId}/suspend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 只挂起和返回影响，不自动取消
         * @description 只挂起和返回影响，不自动取消；权限：授权前台
         */
        post: operations["suspendSchedule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/clinical-notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 只在IN_PROGRESS登记问题/特殊需求
         * @description 只在IN_PROGRESS登记问题/特殊需求；权限：获授权牙医
         */
        patch: operations["updateClinicalNotes"];
        trace?: never;
    };
    "/appointments/{appointmentId}/applied-treatments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 实施者可不同于预约牙医，治疗日资格/执业有效，冻结目录价
         * @description 实施者可不同于预约牙医，治疗日资格/执业有效，冻结目录价；权限：获授权本人实施牙医
         */
        post: operations["recordAppliedTreatment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/applied-treatments/{appliedTreatmentId}/correct-price": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 仅开票前核实纠错并保留旧新价审计
         * @description 仅开票前核实纠错并保留旧新价审计；权限：另授price.correct能力
         */
        post: operations["correctTreatmentPrice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/invoices/{invoiceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 只读费用凭据，不含付款标识及临床全文
         * @description 只读费用凭据，不含付款标识及临床全文；权限：授权收费/来源读取总部
         */
        get: operations["getInvoice"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 查重后建档，电话不唯一，邮箱可空
         * @description 查重后建档，电话不唯一，邮箱可空；权限：授权前台核实本人
         */
        post: operations["createPatient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients/{patientId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 牙医/收费另从本次就诊最小投影读取
         * @description 牙医/收费另从本次就诊最小投影读取；权限：本人有效绑定/授权前台服务范围
         */
        get: operations["getPatient"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 只改允许字段，ETag不新增业务列
         * @description 只改允许字段，ETag不新增业务列；权限：授权前台核实本人
         */
        patch: operations["updatePatient"];
        trace?: never;
    };
    "/patients/{patientId}/allergy-reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * NO_KNOWN须询问，RECORDED须有效关联，空关系不推无过敏
         * @description NO_KNOWN须询问，RECORDED须有效关联，空关系不推无过敏；权限：授权前台核实
         */
        post: operations["reviewPatientAllergies"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients/{patientId}/allergy-records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 核对当前及撤销项；核验审计历史须另授权读取，不把空关联视为无过敏
         * @description 核对当前及撤销项；核验审计历史须另授权读取，不把空关联视为无过敏；权限：核验本人/授权前台服务范围
         */
        get: operations["listPatientAllergies"];
        put?: never;
        /**
         * 选共享目录，追加核实历史
         * @description 选共享目录，追加核实历史；权限：授权前台核实
         */
        post: operations["addPatientAllergy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients/{patientId}/allergy-records/{allergyId}/correct": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 更正当前值及追加旧新值/主体/时间/依据
         * @description 更正当前值及追加旧新值/主体/时间/依据；权限：授权前台核实
         */
        post: operations["correctPatientAllergy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients/{patientId}/allergy-records/{allergyId}/retract": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 撤销误记保留历史，不改共享目录
         * @description 撤销误记保留历史，不改共享目录；权限：授权前台核实
         */
        post: operations["retractPatientAllergy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/clinics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 最小代码/名称投影，不披露牙医家庭联系资料
         * @description 最小代码/名称投影，不披露牙医家庭联系资料；权限：按用途核验目录读取；牙医名单仅员工
         */
        get: operations["listClinic"];
        put?: never;
        /**
         * 编码/日期/引用验证并留痕
         * @description 编码/日期/引用验证并留痕；权限：HQ resource.write
         */
        post: operations["createClinic"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/clinics/{resourceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 仅总部资源详情，不从目录读取权推导
         * @description 仅总部资源详情，不从目录读取权推导；权限：HQ resource.read及诊所范围
         */
        get: operations["getClinic"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 停用不删历史，调价只影响未来，缩短区间列未来影响
         * @description 停用不删历史，调价只影响未来，缩短区间列未来影响；权限：HQ resource.write
         */
        patch: operations["updateClinic"];
        trace?: never;
    };
    "/dentists": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 最小代码/名称投影，不披露牙医家庭联系资料
         * @description 最小代码/名称投影，不披露牙医家庭联系资料；权限：按用途核验目录读取；牙医名单仅员工
         */
        get: operations["listDentist"];
        put?: never;
        /**
         * 编码/日期/引用验证并留痕
         * @description 编码/日期/引用验证并留痕；权限：HQ resource.write
         */
        post: operations["createDentist"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dentists/{resourceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 仅总部资源详情，不从目录读取权推导
         * @description 仅总部资源详情，不从目录读取权推导；权限：HQ resource.read及诊所范围
         */
        get: operations["getDentist"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 停用不删历史，调价只影响未来，缩短区间列未来影响
         * @description 停用不删历史，调价只影响未来，缩短区间列未来影响；权限：HQ resource.write
         */
        patch: operations["updateDentist"];
        trace?: never;
    };
    "/qualifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 最小代码/名称投影，不披露牙医家庭联系资料
         * @description 最小代码/名称投影，不披露牙医家庭联系资料；权限：按用途核验目录读取；牙医名单仅员工
         */
        get: operations["listQualification"];
        put?: never;
        /**
         * 编码/日期/引用验证并留痕
         * @description 编码/日期/引用验证并留痕；权限：HQ resource.write
         */
        post: operations["createQualification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/qualifications/{resourceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 仅总部资源详情，不从目录读取权推导
         * @description 仅总部资源详情，不从目录读取权推导；权限：HQ resource.read及诊所范围
         */
        get: operations["getQualification"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 停用不删历史，调价只影响未来，缩短区间列未来影响
         * @description 停用不删历史，调价只影响未来，缩短区间列未来影响；权限：HQ resource.write
         */
        patch: operations["updateQualification"];
        trace?: never;
    };
    "/treatments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 最小代码/名称投影，不披露牙医家庭联系资料
         * @description 最小代码/名称投影，不披露牙医家庭联系资料；权限：按用途核验目录读取；牙医名单仅员工
         */
        get: operations["listTreatment"];
        put?: never;
        /**
         * 编码/日期/引用验证并留痕
         * @description 编码/日期/引用验证并留痕；权限：HQ resource.write
         */
        post: operations["createTreatment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/treatments/{resourceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 仅总部资源详情，不从目录读取权推导
         * @description 仅总部资源详情，不从目录读取权推导；权限：HQ resource.read及诊所范围
         */
        get: operations["getTreatment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 停用不删历史，调价只影响未来，缩短区间列未来影响
         * @description 停用不删历史，调价只影响未来，缩短区间列未来影响；权限：HQ resource.write
         */
        patch: operations["updateTreatment"];
        trace?: never;
    };
    "/allergies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 最小代码/名称投影，不披露牙医家庭联系资料
         * @description 最小代码/名称投影，不披露牙医家庭联系资料；权限：按用途核验目录读取；牙医名单仅员工
         */
        get: operations["listAllergy"];
        put?: never;
        /**
         * 编码/日期/引用验证并留痕
         * @description 编码/日期/引用验证并留痕；权限：HQ resource.write
         */
        post: operations["createAllergy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/allergies/{resourceId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 仅总部资源详情，不从目录读取权推导
         * @description 仅总部资源详情，不从目录读取权推导；权限：HQ resource.read及诊所范围
         */
        get: operations["getAllergy"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * 停用不删历史，调价只影响未来，缩短区间列未来影响
         * @description 停用不删历史，调价只影响未来，缩短区间列未来影响；权限：HQ resource.write
         */
        patch: operations["updateAllergy"];
        trace?: never;
    };
    "/dentists/{dentistId}/qualifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 复合主键维护当前资质，续期旧依据留审计
         * @description 复合主键维护当前资质，续期旧依据留审计；权限：HQ resource.write
         */
        post: operations["maintainDentistQualification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dentists/{dentistId}/clinic-assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 保留随时间执业，列未来影响
         * @description 保留随时间执业，列未来影响；权限：HQ resource.write
         */
        post: operations["maintainDentistAssignment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/treatments/{treatmentId}/qualification-requirements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * 必需/非必需含义固定及引用校验
         * @description 必需/非必需含义固定及引用校验；权限：HQ resource.write
         */
        put: operations["setTreatmentRequirements"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cost-entries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 按发生期间/来源查询已确认凭证，不提供覆盖删除
         * @description 按发生期间/来源查询已确认凭证，不提供覆盖删除；权限：HQ cost.verify及范围
         */
        get: operations["listCostEntries"];
        put?: never;
        /**
         * 核验来源唯一，确认主体/时点由服务端取得
         * @description 核验来源唯一，确认主体/时点由服务端取得；权限：HQ cost.verify
         */
        post: operations["recordCostEntry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cost-entries/{costEntryId}/reverse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 核验冲销发生时点及新来源，原正额生成同归属/类型等额负数唯一冲销
         * @description 核验冲销发生时点及新来源，原正额生成同归属/类型等额负数唯一冲销；权限：HQ cost.verify
         */
        post: operations["reverseCostEntry"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance-preparations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 原QuarterlyPerformance的DRAFT/source_snapshot准备，不加业务表
         * @description 原QuarterlyPerformance的DRAFT/source_snapshot准备，不加业务表；权限：HQ cost.verify及人员核验范围
         */
        post: operations["prepareQuarterPerformance"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/performance-calculations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 结束季度系统人员/来源/R1计算，缺依据INCOMPLETE，不自动发布
         * @description 结束季度系统人员/来源/R1计算，缺依据INCOMPLETE，不自动发布；权限：HQ performance.calculate/可信内部季度触发
         */
        post: operations["calculateQuarterPerformance"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/quarterly-performances": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 内部可查状态，普通分析仅当前PUBLISHED
         * @description 内部可查状态，普通分析仅当前PUBLISHED；权限：HQ获授核算/分析范围
         */
        get: operations["listQuarterPerformance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/quarterly-performances/{performanceId}/sources": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 读取冻结依据前保存敏感查询审计
         * @description 读取冻结依据前保存敏感查询审计；权限：HQ sensitive.drilldown及来源权限
         */
        get: operations["getQuarterPerformanceSources"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/quarterly-performances/{performanceId}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 独立事务锁稳定Dentist，校验摘要完整性守恒，原子唯一发布切换
         * @description 独立事务锁稳定Dentist，校验摘要完整性守恒，原子唯一发布切换；权限：HQ performance.publish
         */
        post: operations["publishQuarterPerformance"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/analytics/{metric}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 统一期间/cutoff/版本；零分母不可计算，未处理暂定
         * @description 统一期间/cutoff/版本；零分母不可计算，未处理暂定；权限：HQ analysis.read及范围
         */
        get: operations["getAnalysis"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 只读可信审计，无改删接口，无秘密/无关临床
         * @description 只读可信审计，无改删接口，无秘密/无关临床；权限：HQ audit.read
         */
        get: operations["searchAuditEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/clinical-context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 返回必要过敏风险、问题及实际诊疗，不因知道就诊ID获得无关档案
         * @description 返回必要过敏风险、问题及实际诊疗，不因知道就诊ID获得无关档案；权限：获授权本次就诊牙医
         */
        get: operations["getClinicalContext"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/applied-treatments/{appliedTreatmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 读取历史价及ETag，开票后只读
         * @description 读取历史价及ETag，开票后只读；权限：获授权接诊/另授价格纠错对象范围
         */
        get: operations["getAppliedTreatment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cost-entries/{costEntryId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 已确认凭证及冲销引用只读
         * @description 已确认凭证及冲销引用只读；权限：HQ cost.verify及范围
         */
        get: operations["getCostEntry"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients/lookup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 授权前台按患者编号及出生日期核实检索
         * @description ADC-CONTRACT-20261112-02：当前RECEPTION/getPatient及实际服务诊所；人工核验、主档比对、服务证据/回执同事务，错误不泄露匹配详情。
         */
        post: operations["lookupPatient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/me/patient-registration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 首次就诊直接登记并关联新档案
         * @description 首次就诊由本人填报；不需患者编号或人工批准，不接受已有patient_id。不自动关联历史档案。
         */
        post: operations["registerSelfPatient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/booking-holds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 收费预约的五分钟号源保留
         * @description 收费预约的五分钟号源保留；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        post: operations["createBookingHold"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 本人或授权诊所费用列表
         * @description 本人或授权诊所费用列表；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        get: operations["listPatientBills"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bills/{billId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 费用详情及演示支付退款记录
         * @description 费用详情及演示支付退款记录；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        get: operations["getPatientBill"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bills/{billId}/demo-payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 演示缴费并确认收费预约，不扣真实款
         * @description 演示缴费并确认收费预约，不扣真实款；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        post: operations["payDemoBill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bills/{billId}/close": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 取消未付号源，不登记爽约
         * @description 取消未付号源，不登记爽约；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        post: operations["closePatientBill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patient-bills/{billId}/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * 符合退号事实或收费人员授权的全额演示退款
         * @description 符合退号事实或收费人员授权的全额演示退款；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        post: operations["refundPatientBill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/registration-fees/{clinicId}/{dentistId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * 查询门店医生挂号费
         * @description 查询门店医生挂号费；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        get: operations["getRegistrationFee"];
        /**
         * 按resource.write配置演示门店挂号费
         * @description 按resource.write配置演示门店挂号费；服务端校验当前本人关联/岗位和诊所范围、原订单金额及状态。
         */
        put: operations["setRegistrationFee"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Id: string;
        Money: string;
        UnitPrice: string;
        /** @description DECIMAL(10,2)范围内且数值严格大于零 */
        Units: string;
        /** @enum {string} */
        AppointmentStatus: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "INVOICED" | "CANCELLED";
        /** @enum {string} */
        PerformanceStatus: "DRAFT" | "INCOMPLETE" | "CALCULATED" | "PUBLISHED" | "SUPERSEDED";
        Error: {
            code: string;
            message: string;
            request_id: string;
            field_errors?: {
                field: string;
                code: string;
            }[];
            retry_with_same_key?: boolean;
        };
        CsrfContext: {
            /** @description 匿名CSRF值不是业务身份凭据 */
            csrf_token: string;
        };
        WechatLogin: {
            /** @description wx.login临时代码；不接受自报OpenID */
            code: string;
        };
        StaffLogin: {
            username: string;
            password: string;
        };
        WechatSession: {
            /** @description ADC opaque会话，禁止日志记录 */
            access_token: string;
            /** Format: date-time */
            expires_at: string;
            subject_id: string;
            /** @enum {string} */
            binding_status: "UNBOUND" | "BOUND";
            /** @constant */
            subject_type: "PATIENT";
        };
        WebSession: {
            subject_id: string;
            /** Format: date-time */
            expires_at: string;
            csrf_token: string;
            /** @constant */
            subject_type: "STAFF";
            roles: string[];
            clinic_scope: components["schemas"]["Id"][];
            capabilities: string[];
        };
        Binding: {
            subject_id: string;
            patient_id: components["schemas"]["Id"];
            /** Format: date-time */
            verified_at: string;
            verification_reference?: string;
        };
        Identity: {
            subject_id: string;
            /** @enum {string} */
            subject_type: "PATIENT" | "STAFF";
            roles: string[];
            clinic_scope: components["schemas"]["Id"][];
            capabilities: string[];
            binding: components["schemas"]["Binding"] | null;
        };
        /** @description 仅申请线索和服务点，不要求申请人提供事先批准的核验引用，不授本人访问权。 */
        BindingRequest: {
            patient_number: string;
            /** Format: date */
            date_of_birth: string;
            clinic_id: components["schemas"]["Id"];
        };
        /** @description 仅授权前台提交本次服务点、本人核验结论和实际服务依据说明；后端比对Patient、申请线索及范围。批准/重绑服务点须与申请一致，解绑按本次服务点核验。服务器保存操作者、时间和服务上下文标识；不要求预先存在任意核验引用。 */
        BindingVerification: {
            clinic_id: components["schemas"]["Id"];
            /** @constant */
            patient_number_checked: true;
            /** @constant */
            date_of_birth_checked: true;
            /** @constant */
            person_confirmed: true;
            service_basis: string;
        };
        /** @description 路径requestId定位PENDING申请；批准、当前绑定、历史、审计和回执同事务；成功后requestId成为可查verification_reference。 */
        BindingApproval: {
            patient_id: components["schemas"]["Id"];
            verification_basis: components["schemas"]["BindingVerification"];
            reason: string;
        };
        /** @description 新主体必须有匹配同一Patient的PENDING申请；一次核验批准并原子替换旧绑定，不先制造双有效绑定。 */
        Rebind: {
            new_subject_id: string;
            binding_request_id: string;
            verification_basis: components["schemas"]["BindingVerification"];
            reason: string;
        };
        /** @description 授权前台核实解绑本人及本次服务依据，证据保存BindingEvent；不要求先存在新的绑定申请。 */
        BindingRevocation: {
            verification_basis: components["schemas"]["BindingVerification"];
            reason: string;
        };
        Reason: {
            reason: string;
            verification_reference?: string;
        };
        /** @description 只返回本人申请或授权前台服务点核验所需的最小线索；不暴露Patient命中结果。 */
        BindingRequestView: {
            request_id: string;
            subject_id: string;
            /** @enum {string} */
            status: "PENDING" | "APPROVED";
            patient_number: string;
            /** Format: date */
            date_of_birth: string;
            clinic_id: components["schemas"]["Id"];
            /** Format: date-time */
            submitted_at: string;
        };
        AccountCreate: {
            staff_reference: string;
            username: string;
            dentist_id?: string | null;
        };
        SubjectView: {
            subject_id: string;
            username?: string;
            enabled: boolean;
        };
        /** @description 只在授权核验路径处理，不把明文凭据写回执或日志 */
        CredentialRecovery: {
            verification_reference: string;
            reason: string;
            replacement_password: string;
        };
        GrantCreate: {
            subject_id: string;
            /** @enum {string} */
            role: "RECEPTION" | "DENTIST" | "CASHIER" | "HEADQUARTERS";
            clinic_ids: components["schemas"]["Id"][];
            capabilities: string[];
            /** Format: date-time */
            valid_from: string;
            /** Format: date-time */
            valid_until?: string | null;
        };
        GrantView: {
            grant_id: string;
            subject_id: string;
            role: string;
            clinic_ids: components["schemas"]["Id"][];
            /** Format: date-time */
            valid_from: string;
            /** Format: date-time */
            valid_until?: string | null;
            revoked: boolean;
        };
        CatalogItem: {
            id: components["schemas"]["Id"];
            label: string;
            code?: string;
            active: boolean;
        };
        /** @description 医生职称、方向和简介是患者可见投影，不包含家庭住址、生日或私人联系方式；未维护时返回null。挂号费用分表示，不能根据治疗目录价推断。 */
        Candidate: {
            clinic_id: components["schemas"]["Id"];
            dentist_id: components["schemas"]["Id"];
            dentist_name: string;
            schedule_id: components["schemas"]["Id"];
            /** Format: date-time */
            starts_at: string;
            /** Format: date-time */
            ends_at: string;
            professional_title?: string | null;
            specialty?: string | null;
            introduction?: string | null;
            registration_fee_fen?: number;
        };
        /** @description 患者禁止自报patient_id，从当前绑定取得；前台代办须patient_id及可核验的patient_verification_reference。资格/执业/NORMAL/占位提交时复核。 */
        AppointmentCreate: {
            clinic_id: components["schemas"]["Id"];
            schedule_id: components["schemas"]["Id"];
            /** Format: date-time */
            scheduled_at: string;
            requested_treatment_ids: components["schemas"]["Id"][];
            allergy_confirmation_reference: string;
            patient_id?: components["schemas"]["Id"];
            patient_verification_reference?: string;
            patient_details: components["schemas"]["AppointmentPatientDetails"];
            /** @description 提交全部已知过敏及本次确认；与受保护资料冲突转前台，不由另一份自助提交覆盖。 */
            allergy_declaration: {
                /** @enum {string} */
                review_status: "NOT_REVIEWED" | "NO_KNOWN" | "RECORDED";
                records: {
                    allergy_id: components["schemas"]["Id"];
                    severity_note?: string | null;
                }[];
                /** @constant */
                confirmed: true;
            };
        };
        AppointmentView: {
            appointment_id: components["schemas"]["Id"];
            patient_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            dentist_id: components["schemas"]["Id"];
            schedule_id: components["schemas"]["Id"];
            /** Format: date-time */
            scheduled_at: string;
            status: components["schemas"]["AppointmentStatus"];
            /** Format: date-time */
            attended_at?: string | null;
            /** Format: date-time */
            completed_at?: string | null;
            /** @enum {string|null} */
            cancellation_kind?: "PATIENT_CANCEL" | "NO_SHOW" | "CLINIC_RESCHEDULE" | "CLINIC_CANCEL" | null;
            rescheduled_from_id?: string | null;
            invoice_id?: string | null;
        };
        Attend: {
            verification_reference: string;
        };
        Cancel: {
            reason: string;
            verification_reference?: string;
        };
        NoShow: {
            reason: string;
            verification_reference: string;
        };
        /** @description RESCHEDULE必须提供全部new_*；CLINIC_CANCEL禁止new_*。旧新同患者、无环、唯一直接后继；全部事件同事务。 */
        Reschedule: {
            /** @enum {string} */
            action: "RESCHEDULE" | "CLINIC_CANCEL";
            reason: string;
            verification_reference: string;
            new_clinic_id?: components["schemas"]["Id"];
            new_schedule_id?: components["schemas"]["Id"];
            /** Format: date-time */
            new_scheduled_at?: string;
        } & (unknown & unknown);
        RescheduleView: {
            old_appointment: components["schemas"]["AppointmentView"];
            new_appointment: components["schemas"]["AppointmentView"] | null;
        };
        ScheduleCreate: {
            dentist_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            /** Format: date */
            schedule_date: string;
            /** @description HH:mm:ss，业务本地时间 */
            start_time: string;
            /** @description HH:mm:ss，业务本地时间 */
            end_time: string;
            slot_minutes: number;
            note?: string | null;
        };
        ScheduleView: {
            schedule_id: components["schemas"]["Id"];
            dentist_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            /** Format: date */
            schedule_date: string;
            /** @description HH:mm:ss，业务本地时间 */
            start_time: string;
            /** @description HH:mm:ss，业务本地时间 */
            end_time: string;
            slot_minutes: number;
            note?: string | null;
            /** @enum {string} */
            schedule_status: "NORMAL" | "SUSPENDED";
        };
        SuspendView: {
            schedule: components["schemas"]["ScheduleView"];
            affected_appointment_ids: components["schemas"]["Id"][];
        };
        ClinicalNotes: {
            problems_or_special_needs: string;
        };
        /** @description 实际牙医取可信账号；不接收dentist_id或unit_price。治疗日资格/执业有效，目录价冻结。 */
        TreatmentRecord: {
            treatment_id: components["schemas"]["Id"];
            standard_units: components["schemas"]["Units"];
            /** Format: date-time */
            performed_at: string;
        };
        AppliedTreatmentView: {
            applied_treatment_id: components["schemas"]["Id"];
            appointment_id: components["schemas"]["Id"];
            treatment_id: components["schemas"]["Id"];
            dentist_id: components["schemas"]["Id"];
            standard_units: components["schemas"]["Units"];
            unit_price: components["schemas"]["UnitPrice"];
            subtotal: components["schemas"]["Money"];
            /** Format: date-time */
            performed_at: string;
            /** @description 基于当前原字段计算，不存业务version列 */
            etag?: string;
        };
        /** @description 仅开票前另获价格纠错能力者，审计旧新值，不是普通牙医覆盖。 */
        PriceCorrection: {
            unit_price: components["schemas"]["UnitPrice"];
            reason: string;
            verification_reference: string;
        };
        InvoiceItemView: {
            line_number: number;
            applied_treatment_id: components["schemas"]["Id"];
            treatment_name: string;
            standard_units: components["schemas"]["Units"];
            unit_price: components["schemas"]["UnitPrice"];
            subtotal: components["schemas"]["Money"];
        };
        /** @description 费用凭据不证明实收；不含支付状态/渠道/税费/折扣/退款。 */
        InvoiceView: {
            invoice_id: components["schemas"]["Id"];
            invoice_number: string;
            appointment_id: components["schemas"]["Id"];
            /** Format: date-time */
            issued_at: string;
            total_amount: components["schemas"]["Money"];
            items: components["schemas"]["InvoiceItemView"][];
        };
        /** @description 首次登记只要求姓名、生日、电话和本人过敏声明；地址、邮箱和紧急联系人后补，缺失保存NULL。 */
        PatientCreate: {
            full_name: string;
            /** Format: date */
            date_of_birth: string;
            phone: string;
            billing_address?: string | null;
            email?: string | null;
            emergency_contact_name?: string | null;
            emergency_contact_phone?: string | null;
            verification_basis: components["schemas"]["PatientCreationVerificationBasis"];
        };
        /** @description 首次登记只要求姓名、生日、电话和本人过敏声明；地址、邮箱和紧急联系人后补，缺失保存NULL。前台核实并以If-Match防丢失更新，不自动电话合并。 */
        PatientPatch: {
            full_name?: string;
            /** Format: date */
            date_of_birth?: string;
            phone?: string;
            billing_address?: string | null;
            email?: string | null;
            emergency_contact_name?: string | null;
            emergency_contact_phone?: string | null;
        };
        /** @description 首次登记只要求姓名、生日、电话和本人过敏声明；地址、邮箱和紧急联系人后补，缺失保存NULL。完整档案仅核验本人/授权前台服务范围；牙医/收费通过本次就诊的岗位投影读取必要字段。 SELF_DECLARED表示本人登记，不表示人工/实名核验；NOT_REVIEWED保留医护未复核状态，SD1仅是当前声明快照确认引用。 */
        PatientView: {
            patient_id: components["schemas"]["Id"];
            patient_number: string;
            full_name: string;
            /** Format: date */
            date_of_birth?: string;
            phone?: string;
            billing_address?: string | null;
            email?: string | null;
            emergency_contact_name?: string | null;
            emergency_contact_phone?: string | null;
            /** @enum {string} */
            allergy_review_status: "NOT_REVIEWED" | "NO_KNOWN" | "RECORDED";
            allergy_confirmation_reference?: string | null;
            /** @enum {string} */
            registration_method?: "FRONTDESK" | "SELF_DECLARED";
            self_reported_allergies?: string | null;
        };
        AllergyReview: {
            /** @enum {string} */
            allergy_review_status: "NOT_REVIEWED" | "NO_KNOWN" | "RECORDED";
            verification_reference: string;
            reason: string;
        };
        AllergyRecord: {
            allergy_id: components["schemas"]["Id"];
            severity_note?: string | null;
            clinical_note?: string | null;
            verification_reference: string;
            reason: string;
        };
        AllergyCorrection: {
            severity_note?: string | null;
            clinical_note?: string | null;
            verification_reference: string;
            reason: string;
        };
        QualificationEntry: {
            qualification_id: components["schemas"]["Id"];
            certificate_number: string;
            /** Format: date */
            granted_date: string;
            /** Format: date */
            expiry_date?: string | null;
            verification_status: string;
            verification_reference: string;
        };
        AssignmentEntry: {
            clinic_id: components["schemas"]["Id"];
            /** Format: date */
            start_date: string;
            /** Format: date */
            end_date?: string | null;
            availability_note?: string | null;
            is_active: boolean;
            assignment_id?: components["schemas"]["Id"];
        };
        TreatmentRequirements: {
            requirements: {
                qualification_id: components["schemas"]["Id"];
                is_mandatory: boolean;
            }[];
        };
        /** @description 表D4可维护字段；编码/日期/引用/未来影响由领域检查。 */
        AllergyInput: {
            allergy_name: string;
            description?: string | null;
            is_active: boolean;
        };
        /** @description 仅总部资源能力，If-Match并发控制；保留引用及历史价格。 */
        AllergyPatch: {
            allergy_name?: string;
            description?: string | null;
            is_active?: boolean;
        };
        AllergyView: {
            allergy_id: components["schemas"]["Id"];
            allergy_name: string;
            severity_note?: string | null;
            clinical_note?: string | null;
            is_retracted: boolean;
            etag?: string;
        };
        /** @description 表D6可维护字段；编码/日期/引用/未来影响由领域检查。 */
        ClinicInput: {
            clinic_code: string;
            postal_address: string;
            manager_name?: string | null;
            phone: string;
            email?: string | null;
            office_area_sqm?: string | null;
            is_active: boolean;
        };
        /** @description 仅总部资源能力，If-Match并发控制；保留引用及历史价格。 */
        ClinicPatch: {
            clinic_code?: string;
            postal_address?: string;
            manager_name?: string | null;
            phone?: string;
            email?: string | null;
            office_area_sqm?: string | null;
            is_active?: boolean;
        };
        /** @description 仅总部资源详情；患者目录/候选使用最小投影。 */
        ClinicView: {
            clinic_id: components["schemas"]["Id"];
            clinic_code?: string;
            postal_address?: string;
            manager_name?: string | null;
            phone?: string;
            email?: string | null;
            office_area_sqm?: string | null;
            is_active?: boolean;
            future_impact?: components["schemas"]["ResourceFutureImpact"][];
        };
        /** @description 表D7可维护字段；编码/日期/引用/未来影响由领域检查。 */
        DentistInput: {
            employee_number: string;
            full_name: string;
            /** Format: date */
            date_of_birth: string;
            home_address?: string | null;
            phone: string;
            email?: string | null;
            /** Format: date */
            hire_date: string;
            is_active: boolean;
            termination_date?: string | null;
            professional_title?: string | null;
            specialty?: string | null;
            introduction?: string | null;
        };
        /** @description 仅总部资源能力，If-Match并发控制；保留引用及历史价格。 */
        DentistPatch: {
            employee_number?: string;
            full_name?: string;
            /** Format: date */
            date_of_birth?: string;
            home_address?: string | null;
            phone?: string;
            email?: string | null;
            /** Format: date */
            hire_date?: string;
            is_active?: boolean;
            termination_date?: string | null;
            professional_title?: string | null;
            specialty?: string | null;
            introduction?: string | null;
        };
        /** @description 仅总部资源详情；患者目录/候选使用最小投影。 */
        DentistView: {
            dentist_id: components["schemas"]["Id"];
            employee_number?: string;
            full_name?: string;
            /** Format: date */
            date_of_birth?: string;
            home_address?: string | null;
            phone?: string;
            email?: string | null;
            /** Format: date */
            hire_date?: string;
            is_active?: boolean;
            termination_date?: string | null;
            future_impact?: components["schemas"]["ResourceFutureImpact"][];
            qualifications?: components["schemas"]["DentistQualificationView"][];
            clinic_assignments?: components["schemas"]["DentistAssignmentView"][];
            professional_title?: string | null;
            specialty?: string | null;
            introduction?: string | null;
        };
        /** @description 表D8可维护字段；编码/日期/引用/未来影响由领域检查。 */
        QualificationInput: {
            qualification_name: string;
            description?: string | null;
            is_active: boolean;
        };
        /** @description 仅总部资源能力，If-Match并发控制；保留引用及历史价格。 */
        QualificationPatch: {
            qualification_name?: string;
            description?: string | null;
            is_active?: boolean;
        };
        /** @description 仅总部资源详情；患者目录/候选使用最小投影。 */
        QualificationView: {
            qualification_id: components["schemas"]["Id"];
            qualification_name?: string;
            description?: string | null;
            is_active?: boolean;
            future_impact?: components["schemas"]["ResourceFutureImpact"][];
        };
        /** @description 表D12可维护字段；编码/日期/引用/未来影响由领域检查。 */
        TreatmentInput: {
            treatment_code: string;
            treatment_name: string;
            description?: string | null;
            default_unit_price: string;
            is_active: boolean;
        };
        /** @description 仅总部资源能力，If-Match并发控制；保留引用及历史价格。 */
        TreatmentPatch: {
            treatment_code?: string;
            treatment_name?: string;
            description?: string | null;
            default_unit_price?: string;
            is_active?: boolean;
        };
        /** @description 仅总部资源详情；患者目录/候选使用最小投影。 */
        TreatmentView: {
            treatment_id: components["schemas"]["Id"];
            treatment_code?: string;
            treatment_name?: string;
            description?: string | null;
            default_unit_price?: string;
            is_active?: boolean;
            future_impact?: components["schemas"]["ResourceFutureImpact"][];
            qualification_requirements?: components["schemas"]["TreatmentQualificationView"][];
        };
        /** @description 金额为原DECIMAL(14,2)非负范围；MEDICAL_SUPPLY必须归实施牙医，关联一致；零额description明确零成本范围；确认主体/时点由服务端取。 */
        CostCreate: {
            clinic_id: components["schemas"]["Id"];
            dentist_id?: string | null;
            appointment_id?: string | null;
            applied_treatment_id?: string | null;
            /** @enum {string} */
            cost_type: "MEDICAL_SUPPLY" | "OPERATING";
            amount: components["schemas"]["CostAmount"];
            /** Format: date-time */
            incurred_at: string;
            description?: string | null;
            source_reference: string;
            source_batch: string;
            verification_reference: string;
        };
        CostView: {
            cost_entry_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            dentist_id?: string | null;
            cost_type: string;
            amount: components["schemas"]["Money"];
            /** Format: date-time */
            incurred_at: string;
            source_reference: string;
            source_batch?: string;
            /** Format: date-time */
            confirmed_at: string;
            confirmed_by: string;
            reversal_of_id?: string | null;
        };
        /** @description 核验人员准备DRAFT；证据写原QuarterlyPerformance.source_snapshot，不新建封账/分摊业务表。核实主体和时点不能由客户端自称。 */
        QuarterPreparation: {
            /** Format: date */
            quarter_start: string;
            /** Format: date */
            quarter_end: string;
            /** Format: date-time */
            cutoff: string;
            clinic_ids: components["schemas"]["Id"][];
            closure_evidence: {
                clinic_id: components["schemas"]["Id"];
                source_reference: string;
                verification_reference: string;
                zero_cost_scope?: string[];
            }[];
            personnel_verification_reference: string;
        };
        /** @description 只算已结束季度；系统生成全部人员/来源，不收客户端金额结果。缺准备/封账形成INCOMPLETE，不默认零。 */
        QuarterCalculate: {
            /** Format: date */
            quarter_start: string;
            /** Format: date */
            quarter_end: string;
            /** Format: date-time */
            cutoff: string;
            clinic_ids: components["schemas"]["Id"][];
            preparation_ids?: components["schemas"]["Id"][];
        };
        PerformanceView: {
            quarterly_performance_id: components["schemas"]["Id"];
            dentist_id: components["schemas"]["Id"];
            /** Format: date */
            quarter_start: string;
            /** Format: date */
            quarter_end: string;
            calculation_version: number;
            calculation_status: components["schemas"]["PerformanceStatus"];
            revenue?: components["schemas"]["Money"] | null;
            medical_supply_cost?: components["schemas"]["Money"] | null;
            operating_expense?: components["schemas"]["Money"] | null;
            net_profit?: components["schemas"]["Money"] | null;
            /** @constant */
            incentive_rate: "0.1000";
            incentive_amount?: components["schemas"]["Money"] | null;
            input_hash: string;
            incomplete_reasons: string[];
            /** Format: date-time */
            published_at?: string | null;
        };
        PerformanceSource: {
            quarterly_performance_id: components["schemas"]["Id"];
            /** @constant */
            rule_version: "R1";
            /** Format: date-time */
            cutoff: string;
            input_hash: string;
            /** @description 冻结规则/人员/结算/成本/封账/分摊及尾差；结构见data-model；读取须敏感来源授权 */
            source_snapshot: Record<string, never>;
        };
        PublishInput: {
            expected_input_hash: string;
            review_reference: string;
        };
        AnalysisView: {
            /** @enum {string} */
            metric: "cancellations" | "treatment-comparison" | "skill-slot-coverage" | "skill-structure" | "performance" | "coverage" | "traceability" | "calculation-time";
            /** Format: date-time */
            start: string;
            /** Format: date-time */
            end: string;
            /** Format: date-time */
            cutoff: string;
            rule_version: string;
            value: string | null;
            numerator?: string | null;
            denominator?: string | null;
            sample_count: number;
            excluded_count: number;
            missing_count: number;
            unprocessed_count: number;
            provisional: boolean;
            not_computable_reason: string | null;
            source_references: string[];
            rows?: Record<string, never>[];
        };
        AuditView: {
            audit_id: string;
            subject_id: string;
            action: string;
            object_reference: string;
            clinic_scope?: components["schemas"]["Id"][];
            /** Format: date-time */
            occurred_at: string;
            request_id: string;
            result: string;
            reason?: string;
        };
        RequestReceiptView: {
            operation: string;
            request_key: string;
            /** @enum {string} */
            status: "UNKNOWN" | "PENDING" | "SUCCEEDED";
            resource_references: string[];
            request_id: string;
        };
        CostAmount: string;
        /** @description 输入为冲销凭证经核验的发生时点及新来源；不静默沿用原发生时点或当前时间。金额/类型/归属由原正额产生，reversal_of_id唯一，confirmed_at/by取可信服务端。 */
        CostReversal: {
            /** Format: date-time */
            incurred_at: string;
            source_reference: string;
            source_batch: string;
            verification_reference: string;
            reason: string;
        };
        /** @description 只对获授权本次就诊的接诊牙医提供必要风险及实际治疗，不包含患者账单地址/员工家庭地址等无关资料。 */
        ClinicalContext: {
            appointment: components["schemas"]["AppointmentView"];
            /** @enum {string} */
            patient_allergy_review_status: "NOT_REVIEWED" | "NO_KNOWN" | "RECORDED";
            allergy_records: components["schemas"]["AllergyView"][];
            problems_or_special_needs?: string | null;
            applied_treatments: components["schemas"]["AppliedTreatmentView"][];
            /** @description 本人初次登记的过敏声明，非医护核实，仅实际接诊岗位可见。 */
            self_reported_allergies?: string | null;
        };
        PatientVerificationBasis: {
            clinic_id: components["schemas"]["Id"];
            person_confirmed: boolean;
            service_basis: string;
        };
        PatientCreationVerificationBasis: {
            clinic_id: components["schemas"]["Id"];
            person_confirmed: boolean;
            service_basis: string;
            /** @default false */
            duplicate_reviewed: boolean;
            review_reason?: string;
        };
        PatientLookup: {
            patient_number: string;
            /** Format: date */
            date_of_birth: string;
            verification_basis: components["schemas"]["PatientVerificationBasis"];
        };
        PatientLookupResult: {
            patient: components["schemas"]["PatientView"];
            verification_reference: string;
        };
        DentistQualificationView: {
            qualification_id: components["schemas"]["Id"];
            certificate_number: string;
            /** Format: date */
            granted_date: string;
            /** Format: date */
            expiry_date: string | null;
            verification_status: string;
        };
        DentistAssignmentView: {
            assignment_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            /** Format: date */
            start_date: string;
            /** Format: date */
            end_date: string | null;
            availability_note: string | null;
            is_active: boolean;
        };
        TreatmentQualificationView: {
            qualification_id: components["schemas"]["Id"];
            is_mandatory: boolean;
        };
        ResourceFutureImpact: {
            /** @enum {string} */
            object_kind: "DentistSchedule" | "Appointment";
            object_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            /** Format: date */
            affected_date?: string;
            reason: string;
        };
        AllergyResourceView: {
            allergy_id: components["schemas"]["Id"];
            allergy_name: string;
            description?: string | null;
            is_active: boolean;
        };
        /** @description 首次登记只要求姓名、生日、电话和本人过敏声明；地址、邮箱和紧急联系人后补，缺失保存NULL。 */
        AppointmentPatientDetails: {
            full_name: string;
            /** Format: date */
            date_of_birth: string;
            phone: string;
            billing_address?: string | null;
            email?: string | null;
            emergency_contact_name?: string | null;
            emergency_contact_phone?: string | null;
        };
        /** @description 首次登记只要求姓名、生日、电话和本人过敏声明；地址、邮箱和紧急联系人后补，缺失保存NULL。首次就诊由本人填报；不需患者编号或人工批准，不接受已有patient_id。不自动关联历史档案。 */
        SelfPatientRegistration: {
            full_name: string;
            /** Format: date */
            date_of_birth: string;
            phone: string;
            billing_address?: string | null;
            email?: string | null;
            emergency_contact_name?: string | null;
            emergency_contact_phone?: string | null;
            clinic_id: components["schemas"]["Id"];
            /** @enum {string} */
            allergy_statement: "NONE" | "KNOWN" | "UNSURE";
            allergy_note?: string | null;
            /** @constant */
            consent: true;
        };
        PatientPayment: {
            payment_id: components["schemas"]["Id"];
            /** @enum {string} */
            status: "SUCCEEDED" | "REFUNDED";
            /** Format: date-time */
            paid_at: string;
            refund_id: components["schemas"]["Id"] | null;
            refund_reason: string | null;
        };
        PatientBill: {
            bill_id: components["schemas"]["Id"];
            patient_id: components["schemas"]["Id"];
            clinic_id: components["schemas"]["Id"];
            /** @enum {string} */
            kind: "REGISTRATION" | "TREATMENT";
            amount_fen: number;
            /** @enum {string} */
            status: "PENDING" | "PAID" | "CLOSED" | "REFUNDED";
            hold_id: components["schemas"]["Id"] | null;
            appointment_id: components["schemas"]["Id"] | null;
            invoice_id: components["schemas"]["Id"] | null;
            /** @enum {string} */
            mode: "DEMO";
            /** @constant */
            payment_notice: "演示支付，不扣真实款";
            clinic_name: string;
            /** Format: date-time */
            expires_at: string | null;
            /** Format: date-time */
            scheduled_at: string | null;
            dentist_name: string | null;
            payment: components["schemas"]["PatientPayment"] | null;
            demo_enabled: boolean;
            can_refund: boolean;
        };
        PatientBillPage: {
            items: components["schemas"]["PatientBill"][];
            next_cursor: string | null;
        };
        RegistrationFee: {
            clinic_id: components["schemas"]["Id"];
            dentist_id: components["schemas"]["Id"];
            amount_fen: number;
            demo_enabled: boolean;
        };
        RegistrationFeeInput: {
            amount_fen: number;
        };
        PatientRefundInput: {
            reason: string;
        };
        EmptyCommand: Record<string, never>;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    initializeWebCsrf: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfContext"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createWechatSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WechatLogin"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WechatSession"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createStaffSession: {
        parameters: {
            query?: never;
            header: {
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffLogin"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    /** @description adc_session为Secure/HttpOnly/SameSite的服务端会话Cookie，前端不可读取其值 */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebSession"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 已完整提交，无响应体 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getCurrentIdentity: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Identity"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    requestPatientBinding: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BindingRequest"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BindingRequestView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getPatientBinding: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Binding"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listBindingRequests: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["BindingRequestView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    approvePatientBinding: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                requestId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BindingApproval"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Binding"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    rebindPatient: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                subjectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Rebind"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Binding"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    revokePatientBinding: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                subjectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BindingRevocation"];
            };
        };
        responses: {
            /** @description 已完整提交，无响应体 */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listStaffAccounts: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["SubjectView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createStaffAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    activateStaffAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                subjectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reason"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    deactivateStaffAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                subjectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reason"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    credentialrecoveryStaffAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                subjectId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CredentialRecovery"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listClinicGrants: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                subject_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["GrantView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createClinicGrant: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GrantCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GrantView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    revokeClinicGrant: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                grantId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reason"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GrantView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getRequestResult: {
        parameters: {
            query: {
                operation: string;
            };
            header?: never;
            path: {
                requestKey: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RequestReceiptView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    searchAppointmentCandidates: {
        parameters: {
            query: {
                cursor?: string;
                limit?: number;
                clinic_id: components["schemas"]["Id"];
                treatment_ids: components["schemas"]["Id"][];
                start: string;
                end: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["Candidate"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listAppointments: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                clinic_id?: components["schemas"]["Id"];
                start?: string;
                end?: string;
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["AppointmentView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createAppointment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AppointmentCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getAppointment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    attendAppointment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Attend"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    cancelAppointment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Cancel"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    markNoShow: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NoShow"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    rescheduleAppointment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reschedule"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RescheduleView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    completeAppointment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    invoiceAppointment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listSchedules: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                clinic_id?: components["schemas"]["Id"];
                dentist_id?: components["schemas"]["Id"];
                start?: string;
                end?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["ScheduleView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createSchedule: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScheduleCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduleView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    suspendSchedule: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                scheduleId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reason"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuspendView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateClinicalNotes: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClinicalNotes"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    recordAppliedTreatment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TreatmentRecord"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppliedTreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    correctTreatmentPrice: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                appliedTreatmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PriceCorrection"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppliedTreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getInvoice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                invoiceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createPatient: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatientCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getPatient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                patientId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updatePatient: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                patientId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatientPatch"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    reviewPatientAllergies: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                patientId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AllergyReview"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listPatientAllergies: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path: {
                patientId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["AllergyView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    addPatientAllergy: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                patientId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AllergyRecord"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    correctPatientAllergy: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                patientId: string;
                allergyId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AllergyCorrection"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    retractPatientAllergy: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                patientId: string;
                allergyId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["Reason"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listClinic: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CatalogItem"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createClinic: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClinicInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClinicView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getClinic: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClinicView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateClinic: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClinicPatch"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClinicView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listDentist: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CatalogItem"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createDentist: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DentistInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DentistView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getDentist: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DentistView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateDentist: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DentistPatch"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DentistView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listQualification: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CatalogItem"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createQualification: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QualificationInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QualificationView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getQualification: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QualificationView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateQualification: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QualificationPatch"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QualificationView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listTreatment: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CatalogItem"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createTreatment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TreatmentInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getTreatment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateTreatment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TreatmentPatch"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listAllergy: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CatalogItem"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createAllergy: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AllergyInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AllergyResourceView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getAllergy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AllergyResourceView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    updateAllergy: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                resourceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AllergyPatch"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AllergyResourceView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    maintainDentistQualification: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                dentistId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QualificationEntry"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DentistView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    maintainDentistAssignment: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                dentistId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignmentEntry"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DentistView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    setTreatmentRequirements: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
                /** @description 基于现有字段的ETag，不新增业务version列 */
                "If-Match": string;
            };
            path: {
                treatmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TreatmentRequirements"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listCostEntries: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                clinic_id?: components["schemas"]["Id"];
                start?: string;
                end?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["CostView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    recordCostEntry: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CostCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CostView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    reverseCostEntry: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                costEntryId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CostReversal"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CostView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    prepareQuarterPerformance: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuarterPreparation"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["PerformanceView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    calculateQuarterPerformance: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuarterCalculate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["PerformanceView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listQuarterPerformance: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                quarter_start?: string;
                quarter_end?: string;
                dentist_id?: components["schemas"]["Id"];
                calculation_status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["PerformanceView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getQuarterPerformanceSources: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                performanceId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PerformanceSource"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    publishQuarterPerformance: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                performanceId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PublishInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PerformanceView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getAnalysis: {
        parameters: {
            query: {
                clinic_id?: components["schemas"]["Id"];
                start: string;
                end: string;
                cutoff: string;
                rule_version: string;
                treatment_id?: components["schemas"]["Id"];
                dentist_id?: components["schemas"]["Id"];
            };
            header?: never;
            path: {
                metric: "cancellations" | "treatment-comparison" | "skill-slot-coverage" | "skill-structure" | "performance" | "coverage" | "traceability" | "calculation-time";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AnalysisView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    searchAuditEvents: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                start?: string;
                end?: string;
                action?: string;
                object_reference?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        items: components["schemas"]["AuditView"][];
                        next_cursor: string | null;
                    };
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getClinicalContext: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClinicalContext"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getAppliedTreatment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appliedTreatmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppliedTreatmentView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getCostEntry: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                costEntryId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CostView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    lookupPatient: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatientLookup"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientLookupResult"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    registerSelfPatient: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SelfPatientRegistration"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    /** @description 支持If-Match的资源返回基于现有字段计算的版本标识 */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientView"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    createBookingHold: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AppointmentCreate"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientBill"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listPatientBills: {
        parameters: {
            query?: {
                cursor?: components["schemas"]["Id"];
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientBillPage"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getPatientBill: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                billId: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientBill"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    payDemoBill: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                billId: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmptyCommand"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientBill"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    closePatientBill: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                billId: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmptyCommand"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientBill"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    refundPatientBill: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                billId: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatientRefundInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientBill"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    getRegistrationFee: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                clinicId: components["schemas"]["Id"];
                dentistId: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RegistrationFee"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    setRegistrationFee: {
        parameters: {
            query?: never;
            header: {
                /** @description 同主体/操作同键同内容复用，异内容409，超时复用原键 */
                "Idempotency-Key": string;
                /** @description Web Cookie/员工登录必须；仅WECHAT Bearer不适用，不能网页Bearer绕CSRF */
                "X-CSRF-Token"?: string;
            };
            path: {
                clinicId: components["schemas"]["Id"];
                dentistId: components["schemas"]["Id"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegistrationFeeInput"];
            };
        };
        responses: {
            /** @description 完成或同请求原结果，不重复创建 */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RegistrationFee"];
                };
            };
            /** @description 格式错误 */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 身份无效/失效 */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 无当前权限/本人绑定 */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 对象不可访问/不存在，不泄漏范围外存在性 */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 状态/占位/绑定/版本/同键异内容冲突 */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description If-Match过时 */
            412: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 字段/资格/日期/完整性不满足 */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 认证失败限制 */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 非预期内部错误，脱敏request_id，结果未知时原键查询/重试 */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            /** @description 依赖不可验证/锁超时/提交未知，原键重试 */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
}

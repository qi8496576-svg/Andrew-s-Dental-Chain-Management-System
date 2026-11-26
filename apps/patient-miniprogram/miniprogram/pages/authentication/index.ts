import {routes} from '../../services/presentation'
import { patientSession } from '../../services/session'
import { ApiFailure } from '../../services/http'

Page({
  ...routes,
  data: { busy: false, authenticated: false, bindingText: '', error: '' },
  async onShow() {
    if (this.data.busy) return
    this.setData({ busy: true, error: '' })
    try {
      const identity = await patientSession().me()
      this.setData({ authenticated: true, bindingText: identity.binding ? '本人就诊资料已关联' : '尚未填写就诊资料，首次登记后即可预约。' })
    } catch (error) {
      this.setData({ authenticated: false, bindingText: '', error: error instanceof ApiFailure && error.status === 401 ? '' : '暂未取得登录状态，请检查连接后重试。' })
    } finally { this.setData({ busy: false }) }
  },
  async login() {
    if (this.data.busy) return
    this.setData({ busy: true, error: '' })
    try {
      const identity = await patientSession().login()
      this.setData({ authenticated: true, bindingText: identity.binding ? '本人就诊资料已关联' : '尚未填写就诊资料，首次登记后即可预约。' })
    } catch (error) {
      const messages: Record<string, string> = {
        AUTH_ATTEMPT_LIMITED: '登录尝试暂受限制，请稍后重试。',
        CLIENT_WECHAT_LOGIN_UNAVAILABLE: '未能获取微信登录凭证，请检查微信登录状态后重试。',
        CLIENT_LOGIN_NETWORK_UNAVAILABLE: '无法连接患者服务，请检查网络；若网络正常，请联系诊所确认在线服务是否已开通。',
      }
      this.setData({ authenticated: false, bindingText: '', error: error instanceof ApiFailure ? messages[error.code] || '登录暂未完成，请稍后重试或联系诊所。' : '登录暂未完成，请稍后重试或联系诊所。' })
    } finally { this.setData({ busy: false }) }
  },
  async logout() {
    this.setData({ busy: true, error: '' })
    try { await patientSession().logout(); this.setData({ authenticated: false, bindingText: '' }) }
    catch { this.setData({ error: '退出结果尚未确认，请再次退出以核对原请求。' }) }
    finally { this.setData({ busy: false }) }
  },
  profile(){wx.navigateTo({url:'/pages/patients/index'})},
})

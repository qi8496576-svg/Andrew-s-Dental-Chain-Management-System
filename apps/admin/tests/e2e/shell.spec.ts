import { expect, test } from '@playwright/test'

test.beforeAll(async ({ browser }) => {
  console.log(`Browser version: ${browser.version()}`)
})

test('anonymous visitor reaches personal login without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle('工作人员登录 · 安德鲁牙科连锁管理系统')
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
  await expect(page.getByLabel('个人账号')).toBeVisible()
  expect(errors).toEqual([])
})

test('direct nested URL renders not-found, then returns home and survives refresh', async ({ page }) => {
  await page.goto('/unknown/nested')
  await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible()
  await page.getByRole('link', { name: '返回首页' }).click()
  await expect(page).toHaveURL(/\/authentication/)
  await page.reload()
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible()
})

import { test, expect } from '@playwright/test'

test('home loads with hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Stranded Energy/i })).toBeVisible()
})

test('map loads sites', async ({ page }) => {
  await page.goto('/map')
  await expect(page.locator('#main-content, main').first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('heading', { name: /Command Center|Map/i }).first()).toBeVisible({ timeout: 15000 })
})

test('pitch shows live stats', async ({ page }) => {
  await page.goto('/pitch')
  await expect(page.getByText('Verified Sites', { exact: true }).first()).toBeVisible({ timeout: 10000 })
})

test('education page loads', async ({ page }) => {
  await page.goto('/education')
  await expect(page.getByText(/Stranded Value/i).first()).toBeVisible()
})

test('v2.1 routes load', async ({ page }) => {
  for (const path of ['/dashboard', '/provinces', '/status', '/docs/api']) {
    await page.goto(path)
    await expect(page.locator('body')).not.toContainText('404')
  }
})

test('v2.2 routes load', async ({ page }) => {
  for (const path of ['/bookmarks', '/methodology', '/about', '/global', '/benchmarks']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  }
})

test('v2.3 routes load', async ({ page }) => {
  for (const path of ['/privacy', '/roadmap', '/open-data']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  }
})

test('methodology has score tiers and glossary', async ({ page }) => {
  await page.goto('/methodology')
  await expect(page.getByText(/Stranded Score/i).first()).toBeVisible()
  await expect(page.getByText(/Bank pack/i).first()).toBeVisible()
})

test('sites filters and mission control present', async ({ page }) => {
  await page.goto('/sites')
  await expect(page.getByRole('heading', { name: /All Sites/i })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('combobox').first()).toBeVisible()
})

test('compare page loads with site pair', async ({ page }) => {
  await page.goto('/compare?a=G10161&b=G12147')
  await expect(page.getByRole('heading', { name: /Site Compare/i })).toBeVisible({ timeout: 15000 })
  await expect(page.locator('table')).toBeVisible({ timeout: 15000 })
})

test('province print page loads', async ({ page }) => {
  await page.goto('/print/province?province=Alberta')
  await expect(page.getByText(/Executive One-Pager|Alberta/i).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: /Print/i })).toBeVisible()
})

test('onboarding tour dismisses', async ({ page }) => {
  test.setTimeout(60000)
  await page.addInitScript(() => localStorage.removeItem('stranded-onboarding-dismissed'))
  await page.goto('/map')
  await expect(page.getByTestId('geolocate-btn')).toBeVisible({ timeout: 30000 })
  const tour = page.getByTestId('onboarding-tour')
  await expect(tour).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: /Got it|explorons|los geht|exploremos/i }).click()
  await expect(tour).not.toBeVisible({ timeout: 5000 })
})

test('map geolocation button present', async ({ page }) => {
  await page.goto('/map')
  await expect(page.getByTestId('geolocate-btn')).toBeVisible({ timeout: 15000 })
})

test('recent sites in command palette', async ({ page }) => {
  test.setTimeout(60000)
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  await page.goto('/map')
  await expect(page.getByTestId('geolocate-btn')).toBeVisible({ timeout: 45000 })
  await page.evaluate(() => {
    localStorage.setItem('stranded-recent-sites-v2', JSON.stringify([{
      id: 'G10161',
      name: 'Recent palette site',
      province: 'Alberta',
      score: 88,
      visitedAt: new Date().toISOString(),
    }]))
  })
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-command-palette')))
  await expect(page.locator('.command-palette')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('cmd-recent-sites')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Recent palette site')).toBeVisible()
})

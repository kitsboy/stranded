import { test, expect } from '@playwright/test'

test('home loads with hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Stranded Energy/i })).toBeVisible()
})

test('map loads sites', async ({ page }) => {
  await page.goto('/map')
  await expect(page.getByText(/2,611|visible/i)).toBeVisible({ timeout: 15000 })
})

test('pitch shows live stats', async ({ page }) => {
  await page.goto('/pitch')
  await expect(page.getByText(/Verified Sites|2,611/i)).toBeVisible({ timeout: 10000 })
})

test('education page loads', async ({ page }) => {
  await page.goto('/education')
  await expect(page.getByText(/Stranded Value/i).first()).toBeVisible()
})
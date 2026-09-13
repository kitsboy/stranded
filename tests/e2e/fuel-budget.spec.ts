import { test, expect } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const presets = [
  ['landfill-basic', 131, '533'], ['oilgas-modular', 151, '530'],
  ['wastewater-small', 68, '225'], ['coalmine-large', 141, '574'], ['pulp-power', 152, '533'],
] as const

for (const width of [1400, 390]) {
  test(`Mission presets conserve fuel and preview equals Apply at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
    await page.goto('/map/?site=G12350')
    if (width < 600) {
      const expand = page.getByTestId('mobile-site-expand')
      await expect(expand).toBeVisible({ timeout: 45000 })
      await expand.click()
      // The phone sheet is sectioned (t_152a2036): the cockpit, presets and the
      // ASIC/genset selectors live in Build.
      await page.locator('[data-testid="site-section-tab-build"]:visible').first().click()
      await page.waitForTimeout(600)
    }
    const panel = width < 600 ? page.getByTestId('mobile-site-sheet') : page.getByTestId('map-right-column')
    const cockpit = panel.getByTestId('site-cockpit')
    await expect(cockpit).toBeVisible({ timeout: 45000 })
    await expect(panel.getByTestId('cockpit-venting-compare')).toContainText('split unknown')
    const raw = []
    for (const [id, miners, kw] of presets) {
      const card = panel.getByTestId(`fleet-preset-card-${id}`)
      await expect(card).toContainText(`${kw} kW supported`)
      await expect(card).toContainText(`${miners} miners`)
      const before = await card.innerText()
      const sats = before.match(/([\d,]+) sats\/day/)?.[1]
      await panel.getByTestId(`fleet-preset-apply-${id}`).click()
      await expect(panel.getByTestId('miner-stack-count')).toContainText(`${miners}`)
      await expect(panel.getByTestId('cockpit-sats')).toHaveText(sats || 'missing preview')
      await expect(panel.getByTestId('cockpit-readout-strip')).toContainText(`${kw} kW`)
      raw.push({ id, card: before, applied: await cockpit.innerText() })
    }
    // Extra identical generators must not create another fuel supply or miner.
    await panel.getByTestId('fleet-preset-apply-landfill-basic').click()
    const before = await panel.getByTestId('cockpit-sats').innerText()
    await panel.getByTestId('miner-stack-add-genset').click()
    await expect(panel.getByTestId('miner-stack-count')).toContainText('131')
    await expect(panel.getByTestId('cockpit-sats')).toHaveText(before)
    await cockpit.screenshot({ path: testInfo.outputPath(`mission-${width}.png`) })
    writeFileSync(testInfo.outputPath('raw-model-readouts.json'), JSON.stringify(raw, null, 2))
    await testInfo.attach('raw-model-readouts', { body: JSON.stringify(raw, null, 2), contentType: 'application/json' })
  })
}

test('empty saved/share inventory remains empty and cannot earn', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.addInitScript(() => localStorage.setItem('stranded-onboarding-dismissed', '1'))
  await page.goto('/map/?site=G12350&miners=0&asic=s21xp&gensets=&mode=manual&tpl=custom')
  await expect(page.getByTestId('site-cockpit')).toBeVisible({ timeout: 45000 })
  await expect(page.getByTestId('cockpit-sats')).toHaveText('0')
  await expect(page.getByTestId('miner-stack-count')).toContainText('0')
  await expect(page.getByTestId('miner-stack-inc')).toBeDisabled()
  await expect(page.getByTestId('fleet-fuel-budget')).toContainText('2,636 kg')
})

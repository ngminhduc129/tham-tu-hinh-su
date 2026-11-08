import { test, expect, type Page } from '@playwright/test'

const WIDTHS = [360, 390, 768, 1024, 1440]

const ROUTES = [
  { name: 'home', path: '/#/' },
  { name: 'brief', path: '/#/case/case_001/brief' },
  { name: 'evidence', path: '/#/case/case_001/evidence' },
  { name: 'analysis', path: '/#/case/case_001/analysis' },
  { name: 'feedback', path: '/#/case/case_001/feedback' },
  { name: 'notebook', path: '/#/case/case_001/notebook' },
  { name: 'settings', path: '/#/settings' },
]

const SHOT_ROUTES = ROUTES.filter((route) =>
  ['home', 'evidence', 'analysis', 'notebook', 'feedback'].includes(route.name),
)

async function settle(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

async function fontSize(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`chế độ ${scheme}`, () => {
    test.use({ colorScheme: scheme })

    test('không tràn ngang và không có chữ dưới 11px', async ({ page }) => {
      test.setTimeout(240_000)

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })

        for (const route of ROUTES) {
          await page.goto(route.path)
          await settle(page)

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          )
          expect(overflow, `tràn ngang ở ${width}px · ${route.name}`).toBeLessThanOrEqual(1)

          const tooSmall = await page.evaluate(() => {
            const found: Array<{ tag: string; cls: string; size: string; text: string }> = []
            const nodes = document.querySelectorAll<HTMLElement>('body *')

            for (const el of nodes) {
              const text = (el.textContent ?? '').trim()
              if (!text) continue
              if (el.closest('.sr-only')) continue

              const style = getComputedStyle(el)
              if (style.display === 'none' || style.visibility === 'hidden') continue

              const rect = el.getBoundingClientRect()
              if (rect.width === 0 || rect.height === 0) continue

              const size = parseFloat(style.fontSize)
              if (size < 10.99) {
                found.push({
                  tag: el.tagName.toLowerCase(),
                  cls: typeof el.className === 'string' ? el.className : '',
                  size: style.fontSize,
                  text: text.slice(0, 40),
                })
              }
            }

            return found
          })

          expect(
            tooSmall,
            `chữ dưới 11px ở ${width}px · ${route.name}: ${JSON.stringify(tooSmall.slice(0, 5))}`,
          ).toEqual([])
        }
      }
    })

    test('thang chữ đúng theo breakpoint', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/#/')
      await settle(page)

      expect(await fontSize(page, 'body')).toBe(15)
      expect(await fontSize(page, '.hero__copy h1')).toBe(56)
      expect(await fontSize(page, '.eyebrow')).toBe(13)
      expect(await fontSize(page, '.button')).toBe(14)
      expect(await fontSize(page, '.case-card__head h2')).toBe(28)

      await page.setViewportSize({ width: 768, height: 900 })
      await settle(page)
      expect(await fontSize(page, '.hero__copy h1')).toBe(38)
      expect(await fontSize(page, '.case-card__head h2')).toBe(23)

      await page.setViewportSize({ width: 390, height: 900 })
      await settle(page)
      expect(await fontSize(page, '.hero__copy h1')).toBe(38)

      await page.setViewportSize({ width: 360, height: 900 })
      await settle(page)
      expect(await fontSize(page, '.hero__copy h1')).toBe(34)
      expect(await fontSize(page, 'body')).toBe(15)
    })

    test('ảnh chụp để rà soát thủ công', async ({ page }, testInfo) => {
      test.setTimeout(180_000)

      for (const width of [360, 768, 1440]) {
        await page.setViewportSize({ width, height: 950 })

        for (const route of SHOT_ROUTES) {
          await page.goto(route.path)
          await settle(page)
          await page.screenshot({
            path: testInfo.outputPath(`${scheme}-${width}-${route.name}.png`),
            fullPage: true,
          })
        }
      }
    })
  })
}

test('font tiếng Việt thực sự được nạp, không rơi về fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/')
  await settle(page)

  const result = await page.evaluate(async () => {
    const vietnamese = 'ẮẤỆỘỢỮĐăâêôơư'
    await Promise.all([
      document.fonts.load('600 56px "Source Serif 4 Variable"', vietnamese),
      document.fonts.load('400 15px "IBM Plex Sans Variable"', vietnamese),
      document.fonts.load('400 12px "IBM Plex Mono"', vietnamese),
    ])
    await document.fonts.ready
    return {
      display: document.fonts.check('600 56px "Source Serif 4 Variable"', vietnamese),
      body: document.fonts.check('400 15px "IBM Plex Sans Variable"', vietnamese),
      mono: document.fonts.check('400 12px "IBM Plex Mono"', vietnamese),
      displayFamily: getComputedStyle(document.querySelector('.hero__copy h1')!).fontFamily,
      bodyFamily: getComputedStyle(document.body).fontFamily,
      monoFamily: getComputedStyle(document.querySelector('.case-chip')!).fontFamily,
    }
  })

  expect(result.display).toBe(true)
  expect(result.body).toBe(true)
  expect(result.mono).toBe(true)
  expect(result.displayFamily).toContain('Source Serif 4 Variable')
  expect(result.bodyFamily).toContain('IBM Plex Sans Variable')
  expect(result.monoFamily).toContain('IBM Plex Mono')
})

test('hồ sơ 002 mở được từ thư viện và hiển thị đủ 12 chứng cứ', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/')
  await settle(page)

  await expect(page.locator('.case-card')).toHaveCount(2)
  await expect(
    page.getByRole('heading', { name: 'Chiếc xe tay ga cho mượn' }),
  ).toBeVisible()

  await page
    .locator('.case-card')
    .nth(1)
    .getByRole('button', { name: 'Bắt đầu hồ sơ' })
    .click()
  await settle(page)
  await expect(page).toHaveURL(/#\/case\/case_002\/brief$/)
  await expect(page.locator('.case-chip')).toContainText('Vụ án 002')

  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 })
    await page.goto('/#/case/case_002/evidence')
    await settle(page)

    await expect(page.locator('.evidence-card')).toHaveCount(12)
    await expect(page.getByText('Đơn trình báo', { exact: true }).first()).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `tràn ngang ở ${width}px · case_002/evidence`).toBeLessThanOrEqual(1)

    await page.screenshot({
      path: test.info().outputPath(`case_002-${width}-evidence.png`),
      fullPage: true,
    })
  }
})

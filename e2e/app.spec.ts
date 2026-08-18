import { expect, test } from '@playwright/test'

// The built app runs fully offline against localStorage (`handleLocalRequest`
// in production), so every test starts from a clean profile: fresh context
// = clean storage.

function localDateString(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

test('navigates between all pages via the sidebar', async ({ page }) => {
  await page.goto('/')

  const pages = [
    ['Dashboard', 'Dashboard'],
    ['Transactions', 'Transactions'],
    ['Budgets', 'Budgets'],
    ['Categories', 'Categories'],
    ['Recurring', 'Recurring'],
    ['Analytics', 'Analytics'],
    ['Settings', 'Settings'],
  ] as const

  for (const [nav, heading] of pages) {
    await page.getByRole('link', { name: nav }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
})

test('creates a transaction and tracks it on the dashboard and in a budget', async ({
  page,
}) => {
  await page.goto('/transactions')

  await page.getByRole('button', { name: 'Add transaction' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add transaction' })
  await expect(dialog).toBeVisible()
  await dialog.locator('#transaction-amount').fill('1500')
  await dialog.locator('#transaction-description').fill('Groceries')
  await dialog.locator('#transaction-category').selectOption('food')
  await dialog.locator('#transaction-date').fill(localDateString(0))
  await dialog.getByRole('button', { name: 'Add transaction' }).click()
  await expect(dialog).toBeHidden()

  const table = page.locator('table')
  const row = table.locator('tr').filter({ hasText: 'Groceries' })
  await expect(row).toBeVisible()
  await expect(row.getByText(/1\s*500/)).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.locator('main').getByText('Groceries')).toBeVisible()

  await page.getByRole('link', { name: 'Budgets' }).click()
  await page.getByRole('button', { name: 'Add budget' }).first().click()
  const budgetDialog = page.getByRole('dialog', { name: 'Add budget' })
  await budgetDialog.locator('#budget-category').selectOption('food')
  await budgetDialog.locator('#budget-amount').fill('100000')
  await budgetDialog.getByRole('button', { name: 'Add budget' }).click()
  await expect(budgetDialog).toBeHidden()

  const grid = page.locator('.budget-grid')
  await expect(grid.getByText('Food')).toBeVisible()
  await expect(grid.getByText(/10\s*970/)).toBeVisible()
  await expect(grid.getByText(/100\s*000/)).toBeVisible()
})

test('adds a custom category and uses it in a transaction', async ({ page }) => {
  await page.goto('/categories')

  await page.getByRole('button', { name: 'Add category' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add category' })
  await dialog.locator('#category-name').fill('Streaming')
  await dialog.locator('#category-aliases').fill('netflix, spotify')
  await dialog.getByRole('button', { name: 'Add category' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Streaming')).toBeVisible()

  await page.getByRole('link', { name: 'Transactions' }).click()
  await page.getByRole('button', { name: 'Add transaction' }).first().click()
  const txDialog = page.getByRole('dialog', { name: 'Add transaction' })
  await txDialog.locator('#transaction-category').selectOption({ label: 'Streaming' })
  await expect(txDialog.locator('#transaction-category')).toHaveValue('streaming')
  await txDialog.getByRole('button', { name: 'Cancel' }).click()
})

test('recurring template posts the due transaction after a reload', async ({ page }) => {
  await page.goto('/recurring')
  await expect(page.getByText('No recurring templates yet')).toBeVisible()

  await page.getByRole('button', { name: 'Add template' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add template' })
  await expect(dialog).toBeVisible()
  await dialog.locator('#recurring-description').fill('Netflix E2E')
  await dialog.locator('#recurring-amount').fill('20000')
  await dialog.locator('#recurring-category').selectOption('entertainment')
  await dialog.locator('#recurring-interval').selectOption('monthly')
  await dialog.locator('#recurring-start').fill(localDateString(1))
  await dialog.getByRole('button', { name: 'Add template' }).click()
  await expect(dialog).toBeHidden()

  await expect(page.locator('.recurring-list').getByText('Netflix E2E')).toBeVisible()
  await expect(page.getByText(/Next:/)).toBeVisible()

  await page.reload()
  // The engine posts the due template on open and the layout reports it.
  await expect(page.getByText(/Added 1 recurring transaction/)).toBeVisible()
  await page.getByRole('link', { name: 'Transactions' }).click()
  const table = page.locator('table')
  await expect(table.getByText('Netflix E2E')).toBeVisible()
  await expect(table.getByText(/20\s*000/)).toBeVisible()
})

test('toggles dark mode from the sidebar and persists it', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Toggle dark mode' })
  await expect(toggle).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('dark theme swaps body, card and text colors', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForTimeout(300)
  const light = await page.evaluate(() => {
    const body = getComputedStyle(document.body)
    const card = getComputedStyle(document.querySelector('.stat-card') ?? document.body)
    return { bg: body.backgroundColor, card: card.backgroundColor, text: body.color }
  })

  await page.getByRole('button', { name: 'Toggle dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.waitForTimeout(300)
  const dark = await page.evaluate(() => {
    const body = getComputedStyle(document.body)
    const card = getComputedStyle(document.querySelector('.stat-card') ?? document.body)
    return { bg: body.backgroundColor, card: card.backgroundColor, text: body.color }
  })

  expect(light.bg).toBe('rgb(245, 246, 250)')
  expect(light.card).toBe('rgb(255, 255, 255)')
  expect(dark.bg).toBe('rgb(16, 19, 28)')
  expect(dark.card).toBe('rgb(27, 31, 42)')
  expect(dark.text).toBe('rgb(232, 234, 242)')
})

test('exports and restores a backup file', async ({ page }) => {
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Add transaction' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add transaction' })
  await dialog.locator('#transaction-amount').fill('999')
  await dialog.locator('#transaction-description').fill('Backup me')
  await dialog.locator('#transaction-category').selectOption('other')
  await dialog.locator('#transaction-date').fill(localDateString(0))
  await dialog.getByRole('button', { name: 'Add transaction' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('link', { name: 'Settings' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export data' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  let raw = ''
  for await (const chunk of stream) raw += chunk.toString()
  const payload = JSON.parse(raw)

  expect(payload.transactions.some((t: { description: string }) => t.description === 'Backup me')).toBe(
    true,
  )
  expect(payload.budgets).toEqual([])
  expect(payload.categories.length).toBeGreaterThan(0)
  expect(payload.recurring).toEqual([])

  await page.reload()
  await page.goto('/transactions')
  await expect(page.locator('table').getByText('Backup me')).toBeVisible()
})

test('keeps working offline after the first visit (PWA shell)', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Wait for the service worker to take control before cutting the network.
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.evaluate(() => navigator.serviceWorker.ready)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Deep SPA route falls back to the precached index.html, and the
  // local (inline) API keeps serving data with the network down.
  await page.getByRole('link', { name: 'Transactions' }).click()
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  await expect(page.locator('table').first()).toBeVisible()

  await context.setOffline(false)
})

test('undoes a deleted recurring template with its schedule intact', async ({ page }) => {
  await page.goto('/recurring')

  await page.getByRole('button', { name: 'Add template' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Add template' })
  await dialog.locator('#recurring-description').fill('Netflix E2E')
  await dialog.locator('#recurring-amount').fill('20000')
  await dialog.locator('#recurring-category').selectOption('entertainment')
  await dialog.locator('#recurring-interval').selectOption('monthly')
  await dialog.locator('#recurring-start').fill(localDateString(1))
  await dialog.getByRole('button', { name: 'Add template' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.recurring-list').getByText('Netflix E2E')).toBeVisible()

  await page.reload()
  // The engine posts the due transaction and advances the template.
  await expect(page.getByText(/Added 1 recurring transaction/)).toBeVisible()
  await page.goto('/recurring')
  await page.locator('.recurring-list__item').filter({ hasText: 'Netflix E2E' }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.locator('.recurring-list').getByText('Netflix E2E')).toHaveCount(0)

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('.recurring-list').getByText('Netflix E2E')).toBeVisible()

  // The restored template keeps its lastPostedDate: a reload posts nothing.
  await page.reload()
  await expect(page.locator('.recurring-list').getByText('Netflix E2E')).toBeVisible()
  await page.waitForTimeout(1000)
  await expect(page.getByText(/Added 1 recurring transaction/)).toHaveCount(0)
})

test('virtualizes a large transaction list', async ({ page }) => {
  await page.addInitScript(() => {
    const rows = Array.from({ length: 2500 }, (_, i) => ({
      id: `e2e-${i}`,
      date: '2026-08-01',
      amount: 100 + i,
      type: i % 2 === 0 ? 'expense' : 'income',
      category: 'other',
      description: `Virtual row ${i}`,
    }))
    localStorage.setItem('finance-analyzer.transactions.v1', JSON.stringify(rows))
  })
  await page.goto('/transactions')

  const rows = page.locator('tbody tr[data-transaction-id]')
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  await expect(rows.first()).toBeVisible()

  // Only the visible window (plus overscan) is in the DOM.
  const mounted = await rows.count()
  expect(mounted).toBeLessThan(100)

  // Scrolling far down mounts rows deep in the list and unmounts the top.
  await page.evaluate(() => {
    const viewport = document.querySelector('.transaction-table__window')
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  })
  await expect(page.locator('tbody').getByText('Virtual row 2499')).toBeVisible()
  await expect(page.locator('tbody tr[data-transaction-id="e2e-0"]')).toHaveCount(0)

  // The scrollbar still spans the whole list.
  const scrollHeight = await page.evaluate(() => {
    const viewport = document.querySelector('.transaction-table__window')
    return viewport ? viewport.scrollHeight : 0
  })
  expect(scrollHeight).toBeGreaterThan(48 * 2499)
})

test('imports a CSV file dropped onto the page', async ({ page }) => {
  await page.goto('/transactions')

  const csv = 'date,description,amount,type,category\n2026-08-05,Dropped drone,700,expense,other'
  const dataTransfer = await page.evaluateHandle((text) => {
    const transfer = new DataTransfer()
    transfer.items.add(new File([text], 'drone.csv', { type: 'text/csv' }))
    return transfer
  }, csv)
  await page.dispatchEvent('body', 'drop', { dataTransfer })

  const dialog = page.getByRole('dialog', { name: 'Import transactions' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/ready to import/)).toBeVisible()

  await dialog.getByRole('button', { name: 'Import 1 transaction' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('table').getByText('Dropped drone')).toBeVisible()
})
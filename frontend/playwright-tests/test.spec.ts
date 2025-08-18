import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {

  const res = await request.post('http://localhost:3001/login', {
    data: { username: 'y', password: 'yyyy' }
  });
  const { token, user } = await res.json();

  await page.addInitScript(([token, user]) => {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, [token, user]);

  await page.goto('http://localhost:3000');
});

test.describe('Notes App CRUD', () => {

  test('Create a new note', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    await page.goto('http://localhost:3000');
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="login_form_username"]', 'y');
    await page.fill('[data-testid="login_form_password"]', 'yyyy');
    await page.click('[data-testid="login_form_login"]');

    await expect(page.locator('[data-testid="logout"]')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add New Note' }).click();

    const textbox = page.locator('[data-testid="text_input_new_note"]');
    await textbox.waitFor({ state: 'visible', timeout: 10000 });
    await textbox.fill('Test Note');

    const saveButton = page.locator('[data-testid="text_input_save_new_note"]');
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();

    const notification = page.locator('.notification');
    await expect(notification).toHaveText('Added a new note', { timeout: 10000 });
  });

  test('Read notes from server', async ({ page }) => {
    const notes = page.locator('.note');
    await expect(notes.first()).toBeVisible();
  
    const firstNoteTitle = notes.first().locator('h2');
    await expect(firstNoteTitle).not.toBeEmpty();
  });
  
  test('Update an existing note', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    await page.goto('http://localhost:3000');

    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="login_form_username"]', 'y');
    await page.fill('[data-testid="login_form_password"]', 'yyyy');
    await page.click('[data-testid="login_form_login"]');

    await expect(page.locator('[data-testid="logout"]')).toBeVisible({ timeout: 5000 });
    const editButton = page.locator('[data-testid^="edit-"]').first();
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();

    const textarea = page.locator('[data-testid^="text_input-"]').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    await textarea.fill('Updated Note Content');

    const saveButton = page.locator('[data-testid^="text_input_save-"]').first();
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();

    const notification = page.locator('.notification');
    await expect(notification).toHaveText('Note updated', { timeout: 5000 });
  });

  test('Delete a note', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    });

    await page.goto('http://localhost:3000');
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="login_form_username"]', 'y');
    await page.fill('[data-testid="login_form_password"]', 'yyyy');
    await page.click('[data-testid="login_form_login"]');

    await expect(page.locator('[data-testid="logout"]')).toBeVisible({ timeout: 5000 });
    const deleteButton = page.locator('[data-testid^="delete-"]').first();
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
    await deleteButton.click();

    const notification = page.locator('.notification');
    await expect(notification).toHaveText('Note deleted', { timeout: 5000 });
  });

  test('Pagination buttons exist', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'First' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Last' })).toBeVisible();
  });

  
});

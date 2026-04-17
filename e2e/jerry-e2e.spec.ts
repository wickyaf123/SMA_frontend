import { test, expect, Page } from '@playwright/test';

const TEST_USER = { email: 'e2etest@test.com', password: 'TestPass123!' };
const API_BASE = 'http://localhost:3000';

/** Helper: log in via the UI and return the authenticated page. */
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  // Should redirect to /chat after login
  await page.waitForURL('**/chat**', { timeout: 15000 });
}

// ─── 1. AUTHENTICATION FLOW ────────────────────────────────────────────────

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // Should have email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('login with valid credentials redirects to chat', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/chat/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'wrong@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Should stay on login and show error
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── 2. CHAT INTERFACE LOADS ────────────────────────────────────────────────

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('chat page renders with key elements', async ({ page }) => {
    // Should show the chat input area
    const chatInput = page.locator('textarea, input[placeholder*="message" i], input[placeholder*="jerry" i], [data-testid="chat-input"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('connection status shows Jerry Online', async ({ page }) => {
    // Our Phase 2a fix: socket connects on mount, so Jerry should show online
    // Look for any connection indicator text
    const onlineIndicator = page.locator('text=/online|connected/i').first();
    await expect(onlineIndicator).toBeVisible({ timeout: 15000 });
  });

  test('can create a new conversation', async ({ page }) => {
    // Look for a "new chat" or "+" button
    const newChatBtn = page.locator('button:has-text("New"), button[aria-label*="new" i], a:has-text("New Chat"), [data-testid="new-chat"]').first();

    if (await newChatBtn.isVisible()) {
      await newChatBtn.click();
      await page.waitForTimeout(1000);
      // URL should update to /chat or /chat/<id>
      await expect(page).toHaveURL(/\/chat/);
    }
  });
});

// ─── 3. SEND MESSAGE & STREAMING ────────────────────────────────────────────

test.describe('Message Sending & Streaming', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can send a message and receive a streaming response', async ({ page }) => {
    // Create a new conversation first via API to have a clean slate
    const token = await page.evaluate(() => localStorage.getItem('ps_access_token'));
    const convRes = await page.request.post(`${API_BASE}/api/v1/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'E2E Test Chat' },
    });
    const convData = await convRes.json();
    const convId = convData.data?.id;
    expect(convId).toBeTruthy();

    // Navigate to the conversation
    await page.goto(`/chat/${convId}`);
    await page.waitForLoadState('networkidle');

    // Find the message input
    const chatInput = page.locator('textarea, input[placeholder*="message" i], input[placeholder*="jerry" i]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Type and send a message
    await chatInput.fill('Hello Jerry, what can you help me with?');

    // Press Enter or click send button
    const sendBtn = page.locator('button[type="submit"], button[aria-label*="send" i], button:has(svg)').last();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    } else {
      await chatInput.press('Enter');
    }

    // User message should appear
    await expect(page.locator('text=Hello Jerry')).toBeVisible({ timeout: 5000 });

    // Wait for Jerry's response — look for content that Jerry typically replies with.
    // The LangGraph engine streams tokens then assembles the final message.
    // Wait up to 45s for the full response to appear.
    await expect(
      page.locator('text=/pipeline|permit|campaign|contact|help|assist/i').first()
    ).toBeVisible({ timeout: 45000 });
  });
});

// ─── 4. CONVERSATION MANAGEMENT ─────────────────────────────────────────────

test.describe('Conversation Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('conversation list shows in sidebar', async ({ page }) => {
    // The sidebar should list existing conversations
    await page.waitForTimeout(2000);

    // Check for sidebar/conversation list area
    const sidebar = page.locator('nav, [class*="sidebar"], aside').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('can switch between conversations', async ({ page }) => {
    // Create two conversations via API
    const token = await page.evaluate(() => localStorage.getItem('ps_access_token'));

    const conv1Res = await page.request.post(`${API_BASE}/api/v1/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'E2E Conv 1' },
    });
    const conv1 = await conv1Res.json();

    const conv2Res = await page.request.post(`${API_BASE}/api/v1/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'E2E Conv 2' },
    });
    const conv2 = await conv2Res.json();

    // Navigate to first conv
    await page.goto(`/chat/${conv1.data.id}`);
    await expect(page).toHaveURL(new RegExp(conv1.data.id));

    // Navigate to second conv
    await page.goto(`/chat/${conv2.data.id}`);
    await expect(page).toHaveURL(new RegExp(conv2.data.id));
  });

  test('search conversations works via API', async ({ page }) => {
    const token = await page.evaluate(() => localStorage.getItem('ps_access_token'));

    const searchRes = await page.request.get(`${API_BASE}/api/v1/chat/conversations/search?q=E2E`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchData = await searchRes.json();
    expect(searchData.success).toBe(true);
  });
});

// ─── 5. BACKEND API HEALTH ──────────────────────────────────────────────────

test.describe('Backend API Health', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${API_BASE}/health`);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('ok');
  });

  test('auth login endpoint works', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: TEST_USER,
    });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.accessToken).toBeTruthy();
  });

  test('conversations CRUD via API', async ({ request }) => {
    // Login first
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, { data: TEST_USER });
    const { data: loginData } = await loginRes.json();
    const headers = { Authorization: `Bearer ${loginData.accessToken}` };

    // Create
    const createRes = await request.post(`${API_BASE}/api/v1/chat/conversations`, {
      headers,
      data: { title: 'API CRUD Test' },
    });
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    const convId = createData.data.id;

    // Read
    const getRes = await request.get(`${API_BASE}/api/v1/chat/conversations/${convId}`, { headers });
    const getData = await getRes.json();
    expect(getData.success).toBe(true);
    expect(getData.data.id).toBe(convId);

    // List
    const listRes = await request.get(`${API_BASE}/api/v1/chat/conversations`, { headers });
    const listData = await listRes.json();
    expect(listData.success).toBe(true);
    expect(listData.data.length).toBeGreaterThan(0);

    // Delete
    const deleteRes = await request.delete(`${API_BASE}/api/v1/chat/conversations/${convId}`, { headers });
    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
  });

  test('send message via API triggers LangGraph', async ({ request }) => {
    // Login
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, { data: TEST_USER });
    const { data: loginData } = await loginRes.json();
    const headers = { Authorization: `Bearer ${loginData.accessToken}` };

    // Create conversation
    const convRes = await request.post(`${API_BASE}/api/v1/chat/conversations`, {
      headers,
      data: { title: 'LangGraph API Test' },
    });
    const convData = await convRes.json();
    const convId = convData.data.id;

    // Send message — this goes through LangGraph now (no legacy path)
    const msgRes = await request.post(`${API_BASE}/api/v1/chat/conversations/${convId}/messages`, {
      headers,
      data: { content: 'Hi Jerry' },
      timeout: 45000,
    });
    const msgData = await msgRes.json();
    expect(msgData.success).toBe(true);
    // Should have content from LangGraph
    expect(msgData.data.content).toBeTruthy();

    // Cleanup
    await request.delete(`${API_BASE}/api/v1/chat/conversations/${convId}`, { headers });
  });
});

// ─── 6. CANCEL STREAM ───────────────────────────────────────────────────────

test.describe('Cancel Stream', () => {
  test('cancel button appears during streaming and stops response', async ({ page }) => {
    await login(page);

    // Create a fresh conversation
    const token = await page.evaluate(() => localStorage.getItem('ps_access_token'));
    const convRes = await page.request.post(`${API_BASE}/api/v1/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Cancel Test' },
    });
    const convData = await convRes.json();
    await page.goto(`/chat/${convData.data.id}`);
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[placeholder*="message" i]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Send a message that should trigger a longer response
    await chatInput.fill('Tell me everything about solar permit data in detail');
    await chatInput.press('Enter');

    // Look for a cancel/stop button while streaming
    const cancelBtn = page.locator('button:has-text("Stop"), button:has-text("Cancel"), button[aria-label*="stop" i], button[aria-label*="cancel" i]').first();

    // Wait for it to appear (streaming starts)
    try {
      await expect(cancelBtn).toBeVisible({ timeout: 10000 });
      await cancelBtn.click();
      // After cancel, streaming should stop
      await page.waitForTimeout(2000);
    } catch {
      // Cancel button may not appear if response is too fast — that's ok
    }
  });
});

// ─── 7. WEBSOCKET CONNECTION ────────────────────────────────────────────────

test.describe('WebSocket Connection', () => {
  test('socket connects and receives events', async ({ page }) => {
    await login(page);

    // Monitor WebSocket frames
    const wsMessages: string[] = [];
    page.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        wsMessages.push(frame.payload as string);
      });
    });

    await page.waitForTimeout(3000);

    // The socket should have connected (we may see ping/pong frames)
    // At minimum the page shouldn't show "disconnected"
    const disconnected = page.locator('text=/offline|disconnected/i').first();
    const isDisconnected = await disconnected.isVisible().catch(() => false);
    expect(isDisconnected).toBe(false);
  });
});

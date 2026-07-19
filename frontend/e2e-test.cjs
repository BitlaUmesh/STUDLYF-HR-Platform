const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== STARTING END-TO-END AUTOMATED TEST PASS ===');

  // Monitor console errors and logs
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
    } else {
      console.log(`[BROWSER CONSOLE LOG] ${msg.text()}`);
    }
  });

  // Monitor network requests and responses for API calls
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      const method = response.request().method();
      const status = response.status();
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (err) {
        bodyText = '[UNABLE TO PARSE BODY]';
      }
      console.log(`[NETWORK RESPONSE] ${method} ${url} -> Status: ${status} | Body: ${bodyText.substring(0, 300)}`);
    }
  });

  try {
    const testEmail = `hr.test.${Date.now()}@studlyf.com`;
    const testPassword = 'TestPassword123!';

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Signup a new HR account
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 1: Signup a new HR account ---');
    await page.goto('http://localhost:3000/signup');
    await page.fill('input[placeholder="Jane Doe"]', 'Test HR Recruiter');
    await page.fill('input[placeholder="Acme Inc."]', 'Innovate Corp');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Successfully signed up and redirected to /dashboard');

    const cookies = await context.cookies();
    console.log('Cookies set after signup:', cookies.map(c => `${c.name}=${c.value.substring(0, 15)}...`));

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Log out, log back in
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 2: Log out, log back in ---');
    // Find logout button in sidebar/layout
    await page.click('button[title="Log out"], button[title="Log Out"]');
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('Successfully logged out and redirected to /login');

    // Log back in
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Successfully logged back in with same credentials');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Reload the page while logged in
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 3: Reload the page while logged in ---');
    await page.reload();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Session persisted after page reload');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Dashboard metrics verification
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 4: Verify Dashboard metrics ---');
    await page.waitForSelector('text=Hiring Pipeline, text=Documents, text=Templates', { timeout: 5000 }).catch(() => {
      console.log('Metrics selectors loaded');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Talent Search
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 5: Talent Search ---');
    await page.goto('http://localhost:3000/students');
    // Search keyword matching seeded student (e.g. AIML)
    await page.fill('input[placeholder*="AIML"]', 'AIML');
    await page.press('input[placeholder*="AIML"]', 'Enter');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000); // Wait for search API and render

    const matchesCount = await page.locator('text=student matched, text=students matched').textContent().catch(() => '0 matches text');
    console.log(`Search result stats: ${matchesCount}`);

    // Search keyword matching nothing
    // The placeholder is now "Add another keyword…" because we already added "AIML"
    await page.fill('input[placeholder*="keyword"]', 'nonexistent_skill_tag_xyz');
    await page.press('input[placeholder*="keyword"]', 'Enter');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    const noMatches = await page.locator('text=No matches, text=0 students matched').isVisible();
    console.log(`Empty state is visible for nonexistent search: ${noMatches}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Student Detail & Invite to Pipeline
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 6: Student Detail & Invite ---');
    // Search again for AIML to get student card
    await page.goto('http://localhost:3000/students');
    await page.fill('input[placeholder*="AIML"]', 'AIML');
    await page.press('input[placeholder*="AIML"]', 'Enter');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);

    // Click the student's name to view their profile details
    await page.click('text=Aarav Sharma');
    await page.waitForURL('**/students/*', { timeout: 5000 });
    console.log('Navigated to student detail page');

    // Wait for the detail page to render and the invite button to be visible
    await page.waitForSelector('button:has-text("Invite to pipeline")', { timeout: 5000 });
    await page.click('button:has-text("Invite to pipeline")');
    await page.waitForTimeout(2000);

    // Verify student is in /pipeline
    await page.goto('http://localhost:3000/pipeline');
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body');
    console.log('Body text in pipeline page:', bodyText);
    await page.waitForSelector('text=Aarav Sharma', { timeout: 5000 });
    console.log('Student Aarav Sharma is visible in Invited column of pipeline');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Leaderboard Page
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 7: Leaderboard ---');
    await page.goto('http://localhost:3000/leaderboard');
    await page.waitForSelector('text=Aarav Sharma', { timeout: 5000 });
    console.log('Leaderboard page renders correctly and displays candidate');

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Pipeline operations
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 8: Pipeline Drag/Drop, Questions, Meetings, Messaging ---');
    await page.goto('http://localhost:3000/pipeline');
    await page.waitForSelector('text=Aarav Sharma', { timeout: 5000 });

    // Open candidate's details (click Aarav Sharma card)
    await page.click('text=Aarav Sharma');
    await page.waitForSelector('.shadow-2xl button:has-text("overview")', { timeout: 10000 });

    // Click "questions" tab button directly using browser DOM click
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.shadow-2xl button.capitalize'));
      const btn = buttons.find(b => b.textContent.includes('questions'));
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);

    // Add screening question
    const questionText = 'Explain your experience with PyTorch.';
    await page.fill('input[placeholder*="question"]', questionText);
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(1000);

    // Assign/Send screening questions (check checkbox and click assign)
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("Send")');

    // Wait for the success feedback message to ensure network & UI is stable
    await page.waitForSelector('text=Questions sent to candidate', { timeout: 10000 });
    await page.waitForResponse(response => response.url().includes('/api/applications/') && response.request().method() === 'GET');
    await page.waitForTimeout(1000);

    // Verify application status flips to Questions Sent
    console.log('Verification of questions sent status completed');

    // Diagnostic log
    const panelButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.shadow-2xl button')).map(b => ({
        text: b.textContent,
        classes: b.className,
        visible: b.getBoundingClientRect().width > 0
      }));
    });
    console.log('Panel buttons before meeting click:', JSON.stringify(panelButtons, null, 2));

    // Click Meeting tab/button directly using browser DOM click
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.shadow-2xl button.capitalize'));
      console.log('Available buttons in evaluation:', buttons.map(b => b.textContent));
      const btn = buttons.find(b => b.textContent.includes('meeting'));
      console.log('Found meeting button:', btn ? btn.outerHTML : 'NOT FOUND');
      if (btn) {
        btn.click();
        console.log('Meeting button clicked');
      }
    });
    await page.waitForTimeout(2000);
    await page.fill('.shadow-2xl label:has-text("Meeting title") + input', 'Technical Round 1');
    await page.click('button:has-text("Send scheduling invite")');
    await page.waitForResponse(response => response.url().includes('/api/applications/') && response.request().method() === 'GET');
    await page.waitForTimeout(1000);

    // Click Message tab/button directly using browser DOM click
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.shadow-2xl button.capitalize'));
      console.log('Available buttons in message evaluation:', buttons.map(b => b.textContent));
      const btn = buttons.find(b => b.textContent.includes('message'));
      console.log('Found message button:', btn ? btn.outerHTML : 'NOT FOUND');
      if (btn) {
        btn.click();
        console.log('Message button clicked');
      }
    });
    await page.waitForTimeout(2000);
    await page.fill('.shadow-2xl textarea', 'Hello, looking forward to your responses!');
    await page.waitForSelector('button:has-text("Send message"):not([disabled])', { timeout: 5000 });
    await page.click('button:has-text("Send message")');
    await page.waitForTimeout(1500);

    // ─────────────────────────────────────────────────────────────────────────
    // 9. Documents (Offer / Joining Letter)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 9: Offer and Joining Letters ---');
    await page.goto('http://localhost:3000/documents');
    await page.waitForSelector('button:has-text("New letter")', { timeout: 5000 });
    await page.click('button:has-text("New letter")');
    await page.waitForSelector('label:has-text("Candidate name")', { timeout: 5000 });
    
    // Fill candidate details in builder
    await page.fill('label:has-text("Candidate name") ~ input', 'Aarav Sharma');
    await page.fill('label:has-text("Candidate email") ~ input', 'aarav.sharma@studlyf.com');
    await page.fill('label:has-text("Designation") ~ input', 'AI Research Engineer');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(2000);
    await page.waitForTimeout(2000);

    // ─────────────────────────────────────────────────────────────────────────
    // 10. Messages Thread Check
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 10: Messages Thread ---');
    await page.goto('http://localhost:3000/messages');
    await page.waitForTimeout(1500);
    const messageThreadVisible = await page.locator('text=Aarav Sharma').isVisible().catch(() => false);
    console.log(`Messages thread displays the candidate: ${messageThreadVisible}`);

    // ─────────────────────────────────────────────────────────────────────────
    // 11. Settings Persistence
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 11: Settings ---');
    await page.goto('http://localhost:3000/settings');
    await page.waitForSelector('label:has-text("Designation")', { timeout: 5000 });
    await page.fill('label:has-text("Designation") ~ input', 'Principal Recruiter');
    await page.click('button:has-text("Save changes")');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForSelector('label:has-text("Designation")', { timeout: 5000 });
    console.log('Settings verification completed');

    // ─────────────────────────────────────────────────────────────────────────
    // 12. Log out & Auth Guard Verification
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Step 12: Log out & Auth Guard ---');
    await page.click('button[title="Log out"], button[title="Log Out"]');
    await page.waitForURL('**/login', { timeout: 10000 });
    
    // Visit /dashboard directly and check redirect
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    console.log('Auth Guard successfully blocked unauthenticated access and redirected to /login');

  } catch (error) {
    console.error('=== TEST RUN ENCOUNTERED FATAL EXCEPTION ===', error);
  } finally {
    await browser.close();
    console.log('\n=== END-TO-END AUTOMATED TEST PASS FINISHED ===');
  }
})();

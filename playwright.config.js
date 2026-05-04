import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    // Test directory
    testDir: './tests/system',

    // Test file patterns
    testMatch: '**/*.spec.js',

    // Parallel execution
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Workers
    workers: process.env.CI ? 1 : undefined,

    // Reporter
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    // Shared settings for all projects
    use: {
        // Base URL for navigation
        baseURL: 'http://localhost:3001',

        // Collect trace when retrying
        trace: 'on-first-retry',

        // Screenshot on failure
        screenshot: 'only-on-failure',

        // Video on failure
        video: 'retain-on-failure'
    },

    // Configure projects for major browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        },
        // Uncomment for additional browser testing
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] }
        // },
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] }
        // }
    ],

    // Run local dev server before starting the tests
    webServer: {
        command: 'node server/index.js',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120000
    },

    // Test timeout
    timeout: 30000,

    // Expect timeout
    expect: {
        timeout: 5000
    }
});

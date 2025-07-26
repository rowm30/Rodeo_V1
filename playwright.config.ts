import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
  },
};

export default config;

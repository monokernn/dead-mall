import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',workers:1,timeout:120000,
 use:{baseURL:'http://127.0.0.1:5194',viewport:{width:1440,height:900},
 launchOptions:{channel:'msedge',args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-gpu-sandbox']}},
 webServer:{command:'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5194 --strictPort --mode browser-test',url:'http://127.0.0.1:5194',reuseExistingServer:false,timeout:30000}
});

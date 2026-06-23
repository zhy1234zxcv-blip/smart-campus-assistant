// 极简 Service Worker（让 PWA 可安装）
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));

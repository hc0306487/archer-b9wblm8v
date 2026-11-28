// 처음 한 번 열 때 게임 파일을 아이폰에 저장해 두고, 그 뒤로는 인터넷 없이 실행해요.
const CACHE = 'escape-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // 방탈출 캐시만 정리 (같은 주소의 다른 게임 캐시는 건드리지 않음)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('escape-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true })).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit || caches.open(CACHE).then(c => c.match('./index.html')));
      return hit || net;
    })
  );
});

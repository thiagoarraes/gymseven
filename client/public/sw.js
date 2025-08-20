// Service Worker para Notificações Push - GymSeven
const CACHE_NAME = 'gymseven-v1';
const OFFLINE_URL = '/';

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});

// Gerenciar notificações push
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'GymSeven';
  const options = {
    body: data.body || 'Nova notificação do seu treino',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: false,
    tag: data.tag || 'gymseven-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Gerenciar cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  event.notification.close();
  
  // Abrir ou focar na aba do app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Se já tem uma aba aberta, focar nela
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Senão, abrir nova aba
        return self.clients.openWindow('/');
      })
  );
});

// Gerenciar fechamento de notificações
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event);
});
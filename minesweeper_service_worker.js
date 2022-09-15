const version = "v9";
const RUNTIME = "runtime";

const log = console.log;

const cacheTheseUrls = [
    "/minesweeper",
    "favicon.ico",
    "css/styles.css",
    /*        */
    "js/howler.js",
    "js/jquery.js",
    "js/konva.js",
    "js/minesweeper.js",
    "js/modules/balloonCelebration.js",
    "js/modules/Clock.js",
    "js/modules/Sounds.js",
    /*        */
    "sounds/explosion.mp3",
    "sounds/multiple_correct.mp3",
    "sounds/tada.mp3",
    "sounds/tick.mp3",
    /*        */
    "images/balloon.png",
    "images/mine_64.png",
    "images/mine_128.png",
    "images/mine_256.png",
    "images/mine_180.png",
    "images/mine_512.png",
    "images/mine_icon.png",
    /*        */
    "images/background_images/_1.jpeg",
    "images/background_images/_2.jpeg",
    "images/background_images/_3.jpeg",
    "images/background_images/_4.jpeg",
    "images/background_images/_5.jpeg",
    "images/background_images/_6.jpeg",
    "images/background_images/_7.jpeg",
    "images/background_images/_8.jpeg",
    "images/background_images/_9.jpeg",
    "images/background_images/_10.jpeg",
    "images/background_images/_11.jpeg",
    "images/background_images/_12.jpeg",
    /*          */
    "images/sleeping.svg",
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(version)
            .then(cache => cache.addAll(cacheTheseUrls))
            .then(self.skipWaiting())
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
    const currentCaches = [version, RUNTIME];
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return cacheNames.filter(
                    cacheName => !version.includes(cacheName)
                );
            })
            .then(cachesToDelete => {
                return Promise.all(
                    cachesToDelete.map(cacheToDelete =>
                        caches.delete(cacheToDelete)
                    )
                );
            })
            .then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener("fetch", event => {
    // Skip cross-origin requests, like those for Google Analytics.
    if (!event.request.url.startsWith(self.location.origin)) return false;
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return caches.open(RUNTIME).then(cache => {
                return fetch(event.request).then(response => {
                    // Put a copy of the response in the runtime cache.
                    return cache
                        .put(event.request, response.clone())
                        .then(() => response);
                });
            });
        })
    );
});

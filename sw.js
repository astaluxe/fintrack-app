const CACHE_NAME = "fintrack-v11";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=11",
  "./script.js?v=11",
  "./manifest.webmanifest?v=11",
  "./icon-192.png",
  "./icon-512.png"
];


/* =========================
   INSTALACIÓN
========================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)

        .then(
          cache =>
            cache.addAll(
              APP_SHELL
            )
        )

        .then(
          () =>
            self.skipWaiting()
        )

    );

  }
);


/* =========================
   ACTIVACIÓN
========================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(
          keys =>
            Promise.all(

              keys

                .filter(
                  key =>
                    key.startsWith(
                      "fintrack-"
                    )
                    &&
                    key !==
                    CACHE_NAME
                )

                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            )
        )

        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


/* =========================
   PETICIONES
========================= */

self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !==
      "GET"
    ) {
      return;
    }


    /*
      PÁGINAS HTML
    */

    if (
      event.request.mode ===
      "navigate"
    ) {

      event.respondWith(

        fetch(
          event.request
        )

          .then(
            response => {

              const copy =
                response.clone();


              caches
                .open(
                  CACHE_NAME
                )

                .then(
                  cache =>
                    cache.put(
                      "./index.html",
                      copy
                    )
                );


              return response;

            }
          )

          .catch(
            () =>
              caches.match(
                "./index.html"
              )
          )

      );


      return;

    }


    /*
      CSS, JS, ICONOS, ETC.
    */

    event.respondWith(

      caches
        .match(
          event.request
        )

        .then(
          cached => {

            if (cached) {
              return cached;
            }


            return fetch(
              event.request
            )

              .then(
                response => {

                  const copy =
                    response.clone();


                  caches
                    .open(
                      CACHE_NAME
                    )

                    .then(
                      cache =>
                        cache.put(
                          event.request,
                          copy
                        )
                    );


                  return response;

                }
              );

          }
        )

    );

  }
);

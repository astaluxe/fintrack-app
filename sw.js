const CACHE_NAME = "fintrack-v12";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=11",
  "./script.js?v=11",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];


/* =========================
   INSTALAR SERVICE WORKER
========================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)

        .then(
          async cache => {

            for (
              const file of APP_SHELL
            ) {

              try {

                await cache.add(file);

              }

              catch (error) {

                console.warn(
                  "No se pudo cachear:",
                  file,
                  error
                );

              }

            }

          }
        )

        .then(
          () =>
            self.skipWaiting()
        )
    );

  }
);


/* =========================
   ACTIVAR Y BORRAR CACHÉS
   ANTIGUAS
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


    const url =
      new URL(
        event.request.url
      );


    /* =====================
       MANIFEST
       SIEMPRE INTENTA RED
    ===================== */

    if (
      url.pathname.endsWith(
        "manifest.webmanifest"
      )
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
                      event.request,
                      copy
                    )
                );


              return response;

            }
          )

          .catch(
            () =>
              caches.match(
                event.request
              )
          )

      );


      return;

    }


    /* =====================
       NAVEGACIÓN HTML
    ===================== */

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


    /* =====================
       CSS / JS / ICONOS
    ===================== */

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

                  if (
                    !response
                    ||
                    response.status !== 200
                  ) {

                    return response;

                  }


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

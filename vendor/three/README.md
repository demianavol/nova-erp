# Three.js WebGL runtime

Unmodified prebuilt WebGL runtime from the official `mrdoob/three.js` repository, version 0.187.0, fetched through the GitHub connector after npm registry transport failed. Only the two runtime files required by this app are included. No runtime CDN requests.

- three.module.js blob: `4dc5bcedc5dc72dabb37a3da0a98bbaa05321a8a`
- three.core.js blob: `0ee9b6d588348c3177b91d6093cfe8b167778db8`
- MIT license in LICENSE.

The small local package manifest exposes the ESM build only; it has no dependencies or install scripts. This package is installed as `file:vendor/three` for reproducible offline builds.


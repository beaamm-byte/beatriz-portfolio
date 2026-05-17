# Beatriz Moron - portfolio web

Web estatica multipagina preparada para publicarse en GitHub Pages o en un dominio propio.

## Estructura

```text
/
  index.html              Home / portfolio principal
  landing-01.html         Redireccion antigua hacia soft-goods/
  soft-goods/
    index.html            Coleccion Soft Goods
  home-object/
    index.html            Pagina Home & Object Design en desarrollo
  studio/
    .gitkeep              Futuras herramientas o redirecciones
  assets/
    css/
    js/
    img/
      embedded/             Imagenes extraidas del HTML original
      soft-goods/
        rebel/               Imagenes del proyecto Rebel Collection
        troquel/             Imagenes del proyecto Troquel Collection
      home-object/           Imagenes de Home & Object Design
      studio/                Imagenes de herramientas Studio
```

## Rutas internas

- `soft-goods/` apunta a la coleccion.
- `../#ia` vuelve desde una subpagina a la seccion IA del portfolio.
- La seccion Studio actual esta en `index.html#herramientas`.

## Studio

Si una herramienta vive fuera de este repo, puede enlazarse con su URL externa.
Si queremos que viva bajo el mismo dominio, la ruta recomendada es:

```text
studio/nombre-herramienta/
```

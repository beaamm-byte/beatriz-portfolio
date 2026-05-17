# Beatriz Moron - portfolio web

Web estatica multipagina preparada para publicarse en GitHub Pages o en un dominio propio.

## Estructura

```text
/
  index.html              Home / portfolio principal
  landing-01.html         Redireccion antigua hacia soft-goods/
  soft-goods/
    index.html            Coleccion Soft Goods
  studio/
    .gitkeep              Futuras herramientas o redirecciones
  assets/
    css/
    js/
    img/
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


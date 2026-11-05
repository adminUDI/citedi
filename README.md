# CITEDI · Portal y gestor de contenidos

Portada académica en JavaScript basada en la [portada oficial del CITEDI](https://www.citedi.ipn.mx/). Usa una foto del campus y los distintivos institucionales recuperados del respaldo local. La foto puede sustituirse desde el gestor mediante una URL HTTPS.

Las rutas `/portal/`, `/portal/index.php` e `/index.php` redirigen a la portada JavaScript. Las subpáginas públicas se enlazan al sitio oficial. El tablero inspirado en AdmAcademic está en `/admin/academico` y comparte las cuentas del gestor editorial.

El administrador puede crear, buscar, editar y archivar registros en los módulos académicos, de investigación y administrativos. Los módulos usan fichas por categoría con título, responsable, referencia, fecha, estado y observaciones. Los flujos especializados de PHP, sus respaldos y sus cuentas históricas requieren una migración aparte.

## Iniciar en Windows

Requisito: Node.js 24 o posterior. No se necesitan paquetes npm externos.

```powershell
$env:CMS_SETUP_KEY = [guid]::NewGuid().ToString('N')
$env:CMS_SETUP_KEY
node server.js
```

Abre http://127.0.0.1:3000/admin y pega la clave generada en la consola para crear la primera cuenta de administración. La clave deja de habilitar el registro inicial cuando ya existe el administrador. Usa una contraseña de al menos 12 caracteres. La portada está en http://127.0.0.1:3000/.

## Flujo editorial

1. En **Usuarios**, el administrador crea cuentas de editor y puede activar o desactivar su acceso.
2. En **Portada**, cada usuario encuentra los formularios precargados con el borrador compartido. Puede actualizar la presentación, la imagen, la oferta educativa, la descripción de investigación, el aviso y los datos de contacto.
3. **Guardar borrador** conserva los cambios para el equipo. **Vista previa** muestra el último borrador guardado.
4. **Publicar cambios**, disponible al administrador, aplica el contenido a la portada. El editor comprueba la revisión del borrador para evitar sobrescribir cambios de otra sesión.

Los usuarios pueden actualizar su contraseña desde el panel. El contenido, las cuentas y las sesiones locales se guardan en `data/portal.sqlite`. La carpeta `data/` se excluye del código fuente.

## Estructura

- `worker/index.js` contiene las rutas, plantillas, campos, estilos y reglas de acceso.
- `server.js` adapta el mismo núcleo a Node.js y SQLite para instalarlo en un servidor propio.
- `drizzle/0000_cms.sql` define las tablas. En Sites, el Worker usa la conexión D1 declarada como `DB`.
- `build.js` prepara el artefacto de Sites. Configura `CMS_SETUP_KEY` como secreto del Worker antes de entrar en `/admin`.

El servidor local escucha en `127.0.0.1:3000` por defecto. Para alojarlo detrás de un proxy HTTPS, define `PUBLIC_ORIGIN` con el origen público exacto. `HOST` y `PORT` controlan la escucha local.

Código fuente bajo licencia MIT. Las imágenes en `assets/` proceden del respaldo institucional y conservan sus derechos de origen.

# CITEDI · Portal y gestor de contenidos

Portada académica en JavaScript basada en la [portada oficial del CITEDI](https://www.citedi.ipn.mx/). Usa una foto del campus y los distintivos institucionales recuperados del respaldo local. La foto puede sustituirse desde el gestor mediante una URL HTTPS.

Las rutas `/portal/`, `/portal/index.php` e `/index.php` redirigen a la portada JavaScript. Las subpáginas públicas recuperadas se sirven dentro del portal. El tablero inspirado en AdmAcademic está en `/admin/academico` y comparte las cuentas del gestor editorial.

El administrador puede crear, buscar, editar y archivar registros en los módulos académicos, de investigación y administrativos. Los módulos usan fichas por categoría con título, responsable, referencia, fecha, estado y observaciones. Los flujos especializados de PHP, sus respaldos y sus cuentas históricas requieren una migración aparte.

## Iniciar en Windows

Requisito: Node.js 24 o posterior con npm. Ejecuta `npm ci` antes de iniciar el servidor.

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

## Portal recuperado y gestor de páginas

La nueva navegación abre contenido local para Conócenos, Entorno, Investigación, Posgrado y Servicios. Las páginas recuperadas conservan redirecciones desde sus rutas PHP. Las subpáginas de Maestría y Doctorado se consultan desde Secciones del programa.

`portal-seed.json` contiene el contenido público recuperado y las referencias de sus archivos. El ZIP incluye esos archivos en `media/`. El servidor local sirve esa carpeta. En Sites se almacenan en el bucket R2 `BUCKET`. Los archivos se identifican por su hash SHA256.

En **Páginas y publicaciones**, el editor guarda borradores de páginas, noticias, eventos y convocatorias. El administrador publica los cambios. Se almacenan en SQLite o D1 con revisión para detectar ediciones simultáneas. Las publicaciones del CMS aparecen en su ruta pública y en Publicaciones recientes de la portada.

Los formularios de contacto y sugerencias guardan las solicitudes en **Mensajes recibidos**, disponible al administrador. El envío registra el mensaje en esa bandeja.

La numeralia se tomó del portal oficial del IPN consultado el 5 de noviembre de 2026. Algunos documentos ya devolvían 404 en el servidor de origen y se identifican en el informe de migración.

Para construir el Worker, ejecuta `npm run build`. La base de datos local aplica las tablas de `drizzle/` al arrancar. La base de datos y las cuentas locales son independientes de las del sitio publicado.

## Carrusel y avisos de la portada

En **Carrusel y avisos** (`/admin/carrusel`) se administran hasta ocho imágenes y cuatro avisos rotativos. Permite subir imágenes PNG, JPEG, WebP o GIF de hasta 5 MB, elegir imágenes del portal, editar textos y enlaces, ordenar diapositivas y ajustar el intervalo entre 4 y 30 segundos y la transición. El editor guarda borradores y consulta la vista previa; el administrador publica.

Las imágenes nuevas se guardan en `data/home-media/` al ejecutar Node.js y en R2 al publicar en Sites. La configuración y sus revisiones se guardan en la base de datos con `drizzle/0003_home_motion.sql`. Los controles admiten teclado, pausa y gestos táctiles. El movimiento automático respeta la preferencia de movimiento reducido del dispositivo.

## Agenda, videos y pie institucional

La portada incorpora los videos originales de Maestría (`rK5lmU75Wtk`) y Doctorado (`83WbOyWO2ag`), con reproductores adaptables de YouTube. La Agenda Politécnica tiene cinco pestañas y 17 imágenes recuperadas del portal institucional. `portal-reference.json` conserva esta copia de la agenda; no se actualiza automáticamente. Los recursos visuales, la cenefa de Gobierno de México y la tipografía Red Hat Display se sirven desde `assets/`. Los logos, publicaciones y textos institucionales conservan sus derechos de origen.

## Encabezado e idioma inglés

El encabezado institucional usa los logos e icono de idioma recuperados del IPN, con la identidad de CITEDI. La lupa abre un buscador local. Los controles permiten contraste y tamaño de letra. `/en` presenta la portada en inglés, con páginas para About, Research, Environment, Master’s, Doctorate, Admissions, Services y Contact. Las publicaciones y documentos originales en español se identifican mediante enlaces. El formulario en inglés registra solicitudes en la misma bandeja del CMS. `english.js` contiene los textos en inglés; las traducciones se mantienen en el código.

## Redes sociales y transmisiones

Franja compacta debajo de eventos y noticias con cuatro tarjetas: tres grabaciones CITEDI y el mensaje del Secretario. Solo se crea un reproductor al seleccionar un video; cerrar o pulsar Escape lo detiene y devuelve el foco. Sin JavaScript cada tarjeta abre YouTube. Accesos directos a YouTube y Facebook. Desplazamiento horizontal en móviles. Selección en social-videos.json.

## Contacto y campus
Botón flotante guinda abre el formulario existente en la portada; los mensajes siguen llegando a /admin/mensajes. En páginas interiores enlaza a /contacto. Botón verde de volver arriba. Accesos de comunidad encima del menú y casita de inicio. Collage con fotografías oficiales: https://www.citedi.ipn.mx/conocenos/instalaciones/biblioteca.html , deportiva.html y laboratorios.html; archivos locales campus-library.jpg, campus-gardens.jpg, campus-lab.jpg, además del edificio campus.jpg.

## Franja unificada
El video institucional se reproduce una vez y el evento ENDED de la API oficial de YouTube muestra los banners del CMS en el mismo espacio. Botones para alternar entre video y avisos; se eliminó el bloque separado. El carrusel reinicia al activarse y se pausa mientras está oculto. YouTube controla la calidad adaptativa; la API no permite fijar 1080p. Reproductor completo conserva sus controles de calidad.

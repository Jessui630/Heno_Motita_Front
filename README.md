# Heno Motita

Heno Motita es una aplicación web de monitoreo ambiental orientada al registro de líquenes mediante observaciones Hawksworth. La plataforma organiza el trabajo de campo por cuadrillas y concentra en un solo lugar la información de las personas participantes, los árboles observados, las mediciones realizadas y la evidencia fotográfica que respalda cada registro.

El sistema está diseñado para que el personal administrador coordine la operación, las personas encargadas supervisen sus cuadrillas y el alumnado documente su actividad de campo. La interfaz consume una API protegida que conserva la información y aplica las autorizaciones de cada rol.

## Propósito

El proyecto facilita el seguimiento ordenado de campañas de monitoreo ambiental. Cada cuadrilla trabaja durante una vigencia determinada, en una zona e institución definidas. Dentro de ella se registran árboles identificables por un código y, sobre cada árbol, se capturan observaciones que describen la presencia de líquenes en tres secciones del tronco.

Las mediciones usan el método de Hawksworth: se califica por separado el tercio inferior, medio y superior con valores de 0 a 2. La suma produce una puntuación total entre 0 y 6, útil para documentar y comparar las condiciones observadas. Cada observación puede complementarse con notas, ubicación y fotografías de evidencia.

## Capacidades

### Acceso y sesión

- Permite iniciar sesión con correo electrónico y contraseña proporcionados por la administración.
- Recupera la sesión existente al abrir o recargar la aplicación.
- Conserva el token de acceso solamente durante la sesión del navegador, mediante `sessionStorage`.
- Cierra la sesión local cuando la persona usuaria lo solicita o cuando la API responde con un acceso no autorizado (`401`).
- Muestra los datos de la sesión activa: nombre, correo, rol y estado de la cuenta.

### Administración

Las personas con rol `SUPER_ADMIN` disponen de un panel administrativo para consultar el estado general de la operación.

- Consulta el total de encargados, cuadrillas y alumnos registrados.
- Lista encargados con nombre, correo y estado de la cuenta.
- Registra nuevos encargados indicando nombre, correo, contraseña temporal, teléfono opcional e institución.
- Lista cuadrillas con su nombre, zona, persona encargada asignada y estado.
- Consulta el historial de alumnos, incluyendo matrícula, estado y número de membresías en cuadrillas.
- Actualiza manualmente la información mostrada para solicitar datos recientes a la API.

La creación, asignación y control de las cuadrillas y alumnos se gestionan por la API. Esta interfaz muestra los datos devueltos por dicho servicio y presenta las operaciones que están habilitadas para el rol autenticado.

### Panel de encargado

Las personas con rol `CREW_MANAGER` visualizan un resumen de sus cuadrillas vigentes y de la actividad registrada en ellas.

- Muestra el número de cuadrillas asignadas, pendientes, activas, finalizadas y canceladas.
- Informa la cantidad actual de alumnos, árboles, observaciones y evidencias fotográficas.
- Presenta cada cuadrilla vigente con su nombre, zona, institución, fecha límite de vigencia y estadísticas de actividad.
- Permite elegir una de las cuadrillas disponibles para consultar y trabajar con sus registros de campo.

### Panel de alumno

Las personas con rol `STUDENT` pueden consultar su cuadrilla vigente y su propia actividad de campo.

- Muestra el nombre, zona e institución de la cuadrilla asignada.
- Informa el límite de alumnos de la cuadrilla.
- Muestra la cantidad de árboles activos y de observaciones registradas por el alumno.
- Advierte cuando no existe una cuadrilla vigente asignada.

### Registro de árboles

Dentro de una cuadrilla se pueden consultar, crear y editar árboles. Cada árbol contiene:

- Código de identificación único en el contexto de la cuadrilla. La interfaz normaliza el código a mayúsculas y sustituye los espacios por guiones.
- Nombre común.
- Nombre científico, cuando se conoce.
- Latitud y longitud para registrar su posición geográfica.
- Descripción opcional de la ubicación.
- Estado operativo: `ACTIVE`, `INACTIVE` o `ARCHIVED`.

El formulario valida que el código tenga entre 3 y 40 caracteres alfanuméricos o guiones, que el nombre común tenga al menos dos caracteres y que las coordenadas estén dentro de los rangos geográficos válidos. Los encargados pueden modificar el estado de un árbol; el alumnado registra información de acuerdo con los permisos otorgados por la API.

### Observaciones Hawksworth

Al seleccionar un árbol, se consulta su historial de observaciones y se puede registrar una nueva medición o actualizar una existente. Una observación incluye:

- Puntuación del tercio inferior, medio y superior del árbol, con un valor de 0, 1 o 2 para cada tercio.
- Puntuación total Hawksworth calculada a partir de los tres valores, con un mínimo de 0 y máximo de 6.
- Fecha y hora de la observación.
- Notas de campo opcionales.
- Coordenadas opcionales para precisar el punto en que se realizó la observación.
- Estado: `ACTIVE` o `ARCHIVED`.

El historial permite conservar varias observaciones por árbol, lo cual posibilita registrar mediciones realizadas en distintos momentos. Los encargados pueden cambiar el estado de las observaciones según las reglas autorizadas por la API.

### Evidencia fotográfica

Cada observación puede tener imágenes de respaldo. La aplicación permite:

- Consultar las evidencias existentes de una observación.
- Adjuntar imágenes en formato JPG, PNG o WEBP.
- Añadir una descripción de hasta 500 caracteres a cada imagen.
- Eliminar una evidencia cuando sea necesario y se confirme la operación.

Para proteger el almacenamiento y la transferencia de datos, el cliente rechaza archivos mayores a 8 MB y formatos distintos de JPG, PNG o WEBP antes de enviarlos a la API.

## Roles y permisos

La API es la fuente de autoridad para los permisos. La interfaz adapta los paneles, opciones y datos disponibles al rol autenticado, pero cada solicitud protegida también se valida en el servidor.

| Rol | Alcance en la aplicación |
| --- | --- |
| `SUPER_ADMIN` | Consulta el resumen administrativo, los encargados, las cuadrillas y el historial de alumnos; además puede crear encargados. |
| `CREW_MANAGER` | Consulta el panel de sus cuadrillas asignadas, sus métricas y los registros de campo de las cuadrillas disponibles. Puede administrar los estados de árboles y observaciones cuando la API lo autoriza. |
| `STUDENT` | Consulta su cuadrilla vigente, sus métricas de actividad y registra o consulta información de campo dentro de la cuadrilla asignada, conforme a las reglas de la API. |

## Flujo de trabajo

1. La administración crea las cuentas de encargados y organiza las cuadrillas desde los servicios habilitados para el proyecto.
2. Cada encargado consulta las cuadrillas que tiene asignadas, su vigencia y la actividad acumulada.
3. El alumno o encargado selecciona una cuadrilla disponible en el área de registro de campo.
4. Se registra un árbol con su código, identificación y coordenadas, o se selecciona un árbol ya existente.
5. Sobre el árbol seleccionado se registra una observación Hawksworth, con sus tres puntuaciones, fecha, notas y ubicación opcional.
6. Se adjuntan fotografías como evidencia de la observación cuando corresponde.
7. La información queda disponible para consulta posterior en el historial del árbol y en las métricas de la cuadrilla.

## Datos que maneja

| Entidad | Información principal |
| --- | --- |
| Usuario | Nombre, correo, rol y estado de la cuenta. |
| Encargado | Datos de usuario, teléfono opcional e institución. |
| Alumno | Datos de usuario, matrícula y membresías históricas en cuadrillas. |
| Cuadrilla | Nombre, descripción, zona, institución, encargado, periodo de vigencia, límite de alumnos y estado. |
| Árbol | Código, nombre común y científico, coordenadas, descripción de ubicación, responsable del registro y estado. |
| Observación | Árbol y cuadrilla relacionados, persona observadora, fecha, notas, coordenadas, puntuaciones Hawksworth y estado. |
| Evidencia | Observación relacionada, URL segura, archivo original, formato, tamaño, descripción y fecha de carga. |

Los estados de las cuadrillas son `PENDING`, `ACTIVE`, `FINISHED` y `CANCELLED`. Los estados de cuentas, árboles y observaciones permiten conservar un historial sin eliminar información de forma indiscriminada.

## Arquitectura del cliente

El repositorio contiene el cliente web en `heno-motita-frontend`. Se trata de una aplicación de página única desarrollada con React y TypeScript, compilada con Vite.

| Área | Responsabilidad |
| --- | --- |
| `src/App.tsx` | Gestiona el inicio y cierre de sesión, la restauración de sesión y la composición de los paneles principales. |
| `src/components/Dashboard.tsx` | Muestra el panel administrativo para `SUPER_ADMIN`. |
| `src/components/PortalDashboard.tsx` | Presenta los resúmenes específicos de encargados y alumnos. |
| `src/components/FieldWorkspace.tsx` | Centraliza la consulta y captura de árboles, observaciones y evidencias. |
| `src/api/` | Define las solicitudes HTTP a la API para autenticación, administración, portal y trabajo de campo. |
| `src/types/` | Contiene los contratos TypeScript para usuarios, cuadrillas, recursos de campo y respuestas de la API. |
| `src/utils/` | Incluye validaciones de formularios y utilidades de soporte. |

Las solicitudes a la API incluyen el token JWT en el encabezado `Authorization: Bearer <token>`. El cliente espera respuestas JSON, cancela solicitudes que exceden 15 segundos y traduce los errores de la API para mostrarlos en la interfaz.

## Tecnologías

- [React](https://react.dev/) 19 para la interfaz de usuario.
- [TypeScript](https://www.typescriptlang.org/) para el tipado estático.
- [Vite](https://vite.dev/) para el servidor de desarrollo y la compilación de producción.
- `fetch` y la API del navegador para la comunicación HTTP.
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) para el análisis estático.

## Requisitos

- Node.js y npm instalados. Se recomienda utilizar una versión LTS vigente de Node.js.
- Acceso a una instancia disponible de la API de Heno Motita.
- Credenciales válidas para una cuenta creada en la API.

## Configuración local

1. Instala las dependencias del cliente:

   ```bash
   cd heno-motita-frontend
   npm install
   ```

2. Crea el archivo de variables de entorno a partir del ejemplo:

   ```bash
   cp .env.example .env
   ```

3. Configura la URL pública de la API en `.env`:

   ```env
   VITE_API_URL=https://servidor-ejemplo.com/api/v1
   ```

   La URL debe incluir el prefijo `/api/v1` y no debe terminar con una barra (`/`). Por defecto, el cliente apunta a `https://heno-motita.onrender.com/api/v1` si la variable no está definida.

4. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

Vite mostrará en la terminal la dirección local para abrir la aplicación en el navegador.

## Scripts disponibles

Todos los comandos deben ejecutarse desde `heno-motita-frontend`.

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el entorno de desarrollo de Vite. |
| `npm run build` | Ejecuta la comprobación de TypeScript y genera la compilación optimizada para producción. |
| `npm run lint` | Analiza el código con Oxlint. |
| `npm run preview` | Sirve localmente la compilación de producción para revisarla antes de publicar. |

Para comprobar el cliente antes de una publicación, ejecuta:

```bash
npm run lint
npm run build
```

## Seguridad y despliegue

- No incluyas contraseñas, tokens JWT, credenciales de servicios externos ni otros secretos en variables con el prefijo `VITE_`. Vite incorpora estas variables en el código que llega al navegador.
- El token de acceso se almacena solo en `sessionStorage`; no se conserva tras cerrar la pestaña o el navegador, según el comportamiento de la sesión.
- Las peticiones no registran tokens ni contraseñas y cuentan con un tiempo máximo de respuesta de 15 segundos.
- El documento HTML incluye una Política de Seguridad de Contenido (CSP) que restringe las conexiones a la API configurada actualmente. Si se cambia el dominio de la API, actualiza también `connect-src` en `heno-motita-frontend/index.html`.
- Configura en el hosting o CDN los encabezados de producción complementarios, como HSTS, `X-Content-Type-Options` y `frame-ancestors`, ya que Vite genera archivos estáticos.
- El origen exacto donde se publique el frontend debe estar autorizado por la configuración CORS de la API.

## Alcance

Este repositorio contiene el frontend. La persistencia de datos, la autenticación JWT, la aplicación definitiva de permisos, la gestión de cuentas, las asignaciones de cuadrillas y el almacenamiento de imágenes dependen de la API de Heno Motita. Para que la aplicación funcione correctamente, el servicio debe estar disponible, aceptar el origen del frontend y exponer los endpoints esperados bajo la URL configurada.

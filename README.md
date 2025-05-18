# Full Stack Code Challenge - Toolbox

Este proyecto implementa una API backend y un cliente frontend como parte de un desafío técnico. El frontend consume datos de la API, que a su vez obtiene y formatea datos de una API externa.

## Diagrama de Secuencia

El flujo de peticiones sigue el diagrama proporcionado en el desafío: [Diagrama de Secuencia](https://cs1.ssltrust.me/s/6u9aC5hCTEhTpT1) (enlace original del desafío).

## Tecnologías Utilizadas

**API (Backend):**
* Node.js (v14.x)
* Express.js
* Axios (para llamadas a API externa)
* csv-parse (para parseo de CSV)
* Mocha & Chai (para testing)
* Nock (para mockear llamadas HTTP en tests)
* Nodemon (para desarrollo)

**Frontend (Cliente):**
* React (v18.x, programación funcional y Hooks)
* React Bootstrap & Bootstrap (para UI)
* Axios (para llamadas al API backend)
* `react-scripts` (para la gestión del build y desarrollo, parte de Create React App)

**Global:**
* Docker & Docker Compose (para contenerización y orquestación)

## Estructura del Proyecto

toolbox-tech-challenge/├── api/              # Código del Backend API│   ├── src/          # Código fuente de la API│   │   ├── controllers/│   │   ├── routes/│   │   └── services/│   ├── test/         # Tests para la API│   ├── .gitignore│   ├── Dockerfile    # Dockerfile para la API│   └── package.json├── frontend/         # Código del Frontend React│   ├── public/│   ├── src/          # Código fuente del Frontend│   │   ├── components/│   │   └── services/│   ├── .dockerignore # Archivo para ignorar archivos en el contexto Docker del frontend│   ├── .gitignore│   ├── Dockerfile    # Dockerfile para el Frontend│   └── package.json├── .gitignore        # .gitignore global (opcional, pero bueno para archivos a nivel raíz)├── docker-compose.yml # Archivo de Docker Compose para orquestar los servicios└── README.md          # Este archivo
## Requisitos Previos

* Node.js:
    * Para el API: v14.x (gestionado por Docker)
    * Para el Frontend (build local si se hace): v16.x (gestionado por Docker para el build)
    * (Se recomienda NVM - Node Version Manager para gestionar múltiples versiones si se trabaja localmente fuera de Docker)
* npm (usualmente viene con Node.js)
* Docker Desktop (o Docker Engine y Docker Compose CLI) instalado y en ejecución.

## Instalación

1.  **Clonar el repositorio (si aplica):**
    ```bash
    git clone <url-del-repositorio-git>
    cd toolbox-tech-challenge
    ```
2.  **No es necesario `npm install` manual en los subdirectorios `api` o `frontend` si se va a usar Docker exclusivamente**, ya que los Dockerfiles se encargan de esto. Si deseas trabajar localmente en alguno de los proyectos sin Docker, entonces sí necesitarías ejecutar `npm install` en el directorio correspondiente (`api/` o `frontend/`).

## Ejecución

La forma recomendada de ejecutar ambas aplicaciones es usando Docker Compose.

### Usando Docker Compose (Recomendado)

1.  Asegúrate de que Docker Desktop esté en ejecución.
2.  Desde el directorio raíz del proyecto (`toolbox-tech-challenge/`), ejecuta:
    ```bash
    docker compose up --build
    ```
    * `--build`: Fuerza la reconstrucción de las imágenes si los Dockerfiles o el código fuente han cambiado. La primera vez, Docker descargará las imágenes base y construirá las imágenes de la aplicación, lo cual puede tomar unos minutos.
3.  Una vez que los contenedores estén en ejecución:
    * **API**: Estará disponible en `http://localhost:3001`.
    * **Frontend**: Estará disponible en `http://localhost:3000`. Abre esta URL en tu navegador.

4.  Para detener los servicios:
    * Presiona `Ctrl+C` en la terminal donde `docker compose up` está corriendo.
    * Luego, para asegurarte de que los contenedores se eliminan y las redes se limpian (opcional, pero bueno para limpiar):
        ```bash
        docker compose down
        ```

### Ejecución Local (Sin Docker, para desarrollo o pruebas individuales)

#### API (Backend)

1.  Navega al directorio `api/`:
    ```bash
    cd api
    ```
2.  Instala dependencias (si no lo has hecho):
    ```bash
    npm install
    ```
3.  Inicia el servidor en modo desarrollo (con Nodemon):
    ```bash
    npm run dev
    ```
    O en modo producción:
    ```bash
    npm start
    ```
    El API estará disponible en `http://localhost:3001`.

4.  Para ejecutar los tests de la API:
    ```bash
    npm test
    ```

#### Frontend (Cliente)

1.  Navega al directorio `frontend/`:
    ```bash
    cd frontend
    ```
2.  Instala dependencias (si no lo has hecho):
    ```bash
    npm install
    ```
3.  Inicia la aplicación de desarrollo React:
    ```bash
    npm start
    ```
    La aplicación se abrirá automáticamente en `http://localhost:3000` (o el puerto que indique Create React App). El frontend espera que la API esté corriendo en `http://localhost:3001`.

## Endpoints del API

* **`GET /files/data`**: Retorna la lista de archivos procesados con sus líneas válidas en formato JSON.
    * Ejemplo: `curl -X GET http://localhost:3001/files/data -H "accept: application/json"`
    * Permite filtrar por nombre de archivo: `GET /files/data?fileName=<nombre_del_archivo.csv>`
        * Ejemplo: `curl -X GET "http://localhost:3001/files/data?fileName=file1.csv"`

* **`GET /files/list` (Punto Opcional)**: Retorna la lista de nombres de archivos disponibles desde la API externa.
    * Ejemplo: `curl -X GET http://localhost:3001/files/list -H "accept: application/json"`

## Consideraciones y Decisiones de Diseño

* **API Externa**: La comunicación con `https://echo-serv.tbxnet.com` se maneja a través del servicio `api/src/services/externalApi.service.js`. La API Key `"Bearer aSuperSecretKey"` está integrada en este servicio.
* **Procesamiento CSV**: Se utiliza la librería `csv-parse` para un manejo robusto de los archivos CSV. Se descartan líneas que no cumplan con el formato esperado (4 columnas: file, text, number, hex) o que tengan datos inválidos (ej. 'number' no numérico, 'hex' no válido).
* **Manejo de Errores**:
    * **API**: Los errores al descargar archivos individuales de la API externa (ej. 404, 500) o al procesar archivos CSV (ej. contenido malformado) se registran en la consola del API, y dichos archivos o líneas se omiten del resultado final, permitiendo que el proceso continúe para otros archivos/líneas válidas. `Promise.allSettled` se usa para manejar múltiples promesas de procesamiento de archivos.
    * **Frontend**: Los errores de carga de datos desde el API backend se muestran al usuario mediante un mensaje de alerta. Se incluye un spinner de carga.
* **CORS**: El API está configurado para permitir peticiones desde cualquier origen (`*`) para facilitar el desarrollo. En un entorno de producción, esto debería restringirse al dominio específico del frontend.
* **Interfaz de Usuario Frontend**: Se sigue el wireframe proporcionado usando React Bootstrap. Incluye una barra de navegación con un campo de búsqueda (client-side) y un botón de refresco. La tabla muestra los datos de los archivos formateados.
* **Node.js Versions**: Los Dockerfiles están configurados para usar Node 14 para la API y Node 16 para la etapa de build del frontend, según los requisitos.
* **`NODE_OPTIONS` para Build del Frontend**: Se utiliza `NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096'` en el script `build` del `frontend/package.json` para asegurar la compatibilidad con OpenSSL y proveer suficiente memoria durante el build de `react-scripts` dentro de Docker.

## Puntos Opcionales Implementados

* **API:**
    * ✅ Endpoint `GET /files/list`
    * ✅ Filtro por queryparam en `GET /files/data?fileName=<Nombre del archivo>`
* **FRONTEND:**
    * ✅ Poder filtrar por "fileName" usando el punto opcional del API: El frontend tiene un dropdown (si se habilita la carga de `availableFiles`) que utiliza el endpoint `/files/data?fileName=` de la API.
* **GLOBAL:**
    * ✅ Usar Docker o Docker Compose para correr las apps: Implementado con `Dockerfile` para cada servicio y un `docker-compose.yml` para orquestarlos.

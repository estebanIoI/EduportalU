configuracion con la que levanto los contenedores 
```bash
docker network create app-network

```

---

### 1. Base de datos (MySQL)

Tu backend depende de la DB, así que levantamos primero MySQL:

```bash
docker run -d \
--name mysql \
--restart unless-stopped \
--network app-network \
-e MYSQL_ROOT_PASSWORD=root_password_123 \
-e MYSQL_DATABASE=evaluacion_insitu \
-e MYSQL_USER=app_user \
-e MYSQL_PASSWORD=app_password_123 \
-v mysql_data:/var/lib/mysql \
-v ./mysql/init:/docker-entrypoint-initdb.d \
mysql:8.0 \
--default-authentication-plugin=mysql_native_password

```

- 

---

### 2. Backend

El backend debe conectarse al contenedor MySQL por el **nombre del servicio** (`mysql` en la misma red).

```bash
docker run -d \
  --name backend \
  --restart unless-stopped \
  --network app-network \
  -p 3000:3000 \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USER=app_user \
  -e DB_PASSWORD=app_password_123 \
  -e DB_NAME=evaluacion_insitu \
  -e SKIP_DB_CHECK=false \
  -e LOG_LEVEL=DEBUG \
  docker.io/1006946898/formulario-v1-backend:latest
  
  
  docker.io/1006946898/evaluacion-insitu-backend:latest

```

---

### 3. Frontend

Por último, el frontend expuesto en el puerto 5000:

```bash
docker run -d \
  --name frontend \
  --restart unless-stopped \
  --network app-network \
  -p 5000:5000 \
  -e PORT=5000 \
  docker.io/1006946898/formulario-v1-frontend:latest

  
  
  
  docker.io/1006946898/evaluacion-insitu-frontend:latest

```

---

.env de los contenedores 

FRONTEND:

cat > /app/.env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://62.146.231.110:3000/api/v1
EOF

BACKEND: 

cat > .env << 'EOF'

# Server configuration

PORT=5000

# Database configuration - Local

DB_HOST=mysql
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=evaluacion_insitu

# Database configuration - Remote

DB_REMOTE_HOST=185.236.182.88
DB_REMOTE_PORT=3306
DB_REMOTE_USER=sysdevops
DB_REMOTE_PASSWORD=cQ/4x88/
DB_REMOTE_NAME=sigedin_ies
DB_SECURITY_NAME=sigedin_seguridad

# JWT configuration

JWT_SECRET=123456789

# Development options

# Set to false to enable database connection check

SKIP_DB_CHECK=false

# Logging configuration (ERROR, WARN, INFO, DEBUG)

LOG_LEVEL=INFO

# Production environment

NODE_ENV=production
EOF
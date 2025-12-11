# Despliegue en DigitalOcean App Platform

## Opción 1: Usando App Spec (Recomendado)

1. Ve a [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click en "Create App"
3. Conecta tu repositorio de GitHub: `estebanIoI/EduportalU`
4. DigitalOcean detectará automáticamente el archivo `.do/app.yaml`
5. Configura las variables de entorno secretas en el panel:
   - `DB_HOST`: Host de tu base de datos MySQL
   - `DB_USER`: Usuario de la base de datos
   - `DB_PASSWORD`: Contraseña de la base de datos
   - `DB_NAME`: Nombre de la base de datos
   - `JWT_SECRET`: Secreto para tokens JWT

## Opción 2: Configuración Manual

Si DigitalOcean no detecta automáticamente la configuración:

### Backend
1. Click "Create App" → GitHub → Selecciona el repo
2. En "Source Directory" ingresa: `backend`
3. Tipo: Web Service
4. Puerto HTTP: `5000`
5. Build Command: (dejarlo vacío, usa Dockerfile)
6. Run Command: (dejarlo vacío, usa Dockerfile)

### Frontend  
1. Agrega otro componente al mismo App
2. En "Source Directory" ingresa: `frontend`
3. Tipo: Web Service
4. Puerto HTTP: `3000`
5. Build Command: (dejarlo vacío, usa Dockerfile)
6. Run Command: (dejarlo vacío, usa Dockerfile)

## Variables de Entorno Requeridas

### Backend
```
NODE_ENV=production
PORT=5000
DB_HOST=<tu-host-mysql>
DB_USER=<tu-usuario>
DB_PASSWORD=<tu-password>
DB_NAME=<tu-base-de-datos>
DB_PORT=3306
JWT_SECRET=<tu-secreto-jwt>
```

### Frontend
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://<tu-backend-url>/api/v1
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_RETRY_ATTEMPTS=3
NEXT_PUBLIC_RETRY_DELAY=1000
```

## Estructura del Proyecto

```
EduportalU/
├── .do/
│   └── app.yaml          # Configuración de DigitalOcean App Platform
├── backend/
│   ├── Dockerfile        # Dockerfile del backend
│   ├── package.json
│   └── src/
├── frontend/
│   ├── Dockerfile        # Dockerfile del frontend
│   ├── package.json
│   └── app/
└── DEPLOY.md            # Este archivo
```

## Notas Importantes

- Asegúrate de tener una base de datos MySQL accesible desde DigitalOcean
- Puedes usar DigitalOcean Managed Databases para MySQL
- Los health checks están configurados en `/api/v1/health` para el backend y `/` para el frontend

# ModHeader

[![CI/CD Pipeline](https://github.com/stescobedo92/ModHeader/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/stescobedo92/ModHeader/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Descripción

ModHeader es un servidor proxy HTTP que permite añadir, modificar y eliminar cabeceras de solicitudes y respuestas HTTP sobre la marcha. Esta herramienta es vital para:

- **Probar autenticación basada en tokens**: Añade headers de Authorization sin modificar el código del backend
- **Bypass de caché**: Modifica headers de cache-control para probar diferentes escenarios
- **Simular diferentes tipos de clientes**: Cambia el User-Agent para simular navegadores, bots, o dispositivos móviles
- **Debugging y testing**: Inyecta headers personalizados para rastreo y análisis

## 🚀 Características

- ✅ Gestión dinámica de headers mediante API REST
- ✅ Soporte para headers de request y response
- ✅ Reglas configurables (add, modify, remove)
- ✅ Activación/desactivación de reglas sin eliminarlas
- ✅ Proxy transparente con modificación de headers en tiempo real
- ✅ API para gestión de reglas
- ✅ Health checks integrados
- ✅ Dockerizado y listo para Kubernetes
- ✅ Tests unitarios e integración completos

## 📋 Prerequisitos

- Node.js >= 16.0.0
- npm o yarn
- Docker (opcional, para deployment)
- Kubernetes (opcional, para deployment en cluster)

## 🔧 Instalación

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/stescobedo92/ModHeader.git
cd ModHeader

# Instalar dependencias
npm install

# Copiar el archivo de configuración de ejemplo
cp .env.example .env

# Editar .env con tu configuración
# PORT=8080
# TARGET_URL=http://localhost:3000

# Iniciar el servidor
npm start
```

### Instalación con Docker

```bash
# Construir la imagen
docker build -t modheader:latest .

# Ejecutar el contenedor
docker run -p 8080:8080 -e TARGET_URL=http://your-backend:3000 modheader:latest
```

### Instalación con Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Deployment en Kubernetes

```bash
# Aplicar configuraciones
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Verificar deployment
kubectl get pods -l app=modheader
kubectl get svc modheader-service
```

## 📚 Uso

### API Endpoints

#### Health Check
```bash
GET http://localhost:8080/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-13T12:00:00.000Z",
  "rulesCount": 3
}
```

#### Listar todas las reglas
```bash
GET http://localhost:8080/api/rules
```

#### Crear una nueva regla

**Añadir header de Authorization:**
```bash
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "type": "request",
    "headers": {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }'
```

**Modificar User-Agent:**
```bash
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "modify",
    "type": "request",
    "headers": {
      "user-agent": "CustomBot/1.0"
    }
  }'
```

**Eliminar cookies:**
```bash
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "remove",
    "type": "request",
    "headers": ["cookie", "set-cookie"]
  }'
```

**Añadir header de CORS en response:**
```bash
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "type": "response",
    "headers": {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE"
    }
  }'
```

#### Actualizar una regla
```bash
curl -X PUT http://localhost:8080/api/rules/{ruleId} \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

#### Eliminar una regla
```bash
curl -X DELETE http://localhost:8080/api/rules/{ruleId}
```

#### Eliminar todas las reglas
```bash
curl -X DELETE http://localhost:8080/api/rules
```

### Tipos de Reglas

#### Action Types
- `add`: Añade nuevos headers
- `modify`: Modifica headers existentes (solo si ya existen)
- `remove`: Elimina headers

#### Type (Scope)
- `request`: Aplica solo a requests
- `response`: Aplica solo a responses
- `both`: Aplica a ambos

### Ejemplos de Uso

#### Ejemplo 1: Testing de autenticación JWT

```bash
# Crear regla para añadir token JWT
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "type": "request",
    "headers": {
      "Authorization": "Bearer your-jwt-token-here"
    }
  }'

# Ahora todas las peticiones a través del proxy tendrán el header Authorization
curl http://localhost:8080/api/protected-endpoint
```

#### Ejemplo 2: Bypass de caché

```bash
# Crear regla para modificar cache headers
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add",
    "type": "request",
    "headers": {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache"
    }
  }'
```

#### Ejemplo 3: Simular diferentes User-Agents

```bash
# Simular un navegador móvil
curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "modify",
    "type": "request",
    "headers": {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
    }
  }'
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests unitarios
npm run test:unit

# Ejecutar solo tests de integración
npm run test:integration

# Ver cobertura
npm test -- --coverage
```

## 🏗️ Arquitectura

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Cliente   │─────▶│  ModHeader   │─────▶│   Backend   │
│             │      │    Proxy     │      │   Server    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │ API REST
                            ▼
                     ┌──────────────┐
                     │    Header    │
                     │   Manager    │
                     └──────────────┘
```

### Componentes

- **index.js**: Servidor principal con Express y proxy middleware
- **headerManager.js**: Lógica de gestión de reglas de headers
- **api.js**: Endpoints REST para CRUD de reglas
- **tests/**: Tests unitarios e integración

## 🔒 Seguridad

- Contenedor Docker ejecuta como usuario no-root
- Health checks integrados
- Validación de inputs en API
- Sin almacenamiento de datos sensibles en logs

## 📊 CI/CD

El proyecto incluye un pipeline completo de CI/CD con GitHub Actions:

- ✅ Tests en múltiples versiones de Node.js (16, 18, 20)
- ✅ Linting y validación de código
- ✅ Cobertura de código con Codecov
- ✅ Build y push automático de imagen Docker
- ✅ Deployment automático a Kubernetes

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 License

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**stescobedo92**

## 🙏 Agradecimientos

- Node.js community
- Express.js framework
- http-proxy-middleware library
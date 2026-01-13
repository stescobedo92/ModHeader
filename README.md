# ModHeader

[![CI/CD Pipeline](https://github.com/stescobedo92/ModHeader/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/stescobedo92/ModHeader/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Description

**ModHeader** is a high-performance HTTP proxy server designed to add, modify, and delete HTTP request and response headers on the fly. This tool is essential for:

* **Testing Token-Based Authentication**: Inject `Authorization` headers without modifying backend code.
* **Cache Bypassing**: Manipulate `cache-control` headers to test different caching scenarios.
* **Client Simulation**: Spoof the `User-Agent` to simulate various browsers, bots, or mobile devices.
* **Debugging & Testing**: Inject custom headers for advanced tracing and logging analysis.

## 🚀 Features

* ✅ **Dynamic Management**: Real-time header manipulation via REST API.
* ✅ **Request/Response Support**: Full control over both inbound and outbound traffic.
* ✅ **Configurable Rules**: Support for `add`, `modify`, and `remove` actions.
* ✅ **Toggleable Rules**: Enable or disable rules instantly without deleting them.
* ✅ **Transparent Proxying**: Seamless real-time header modification.
* ✅ **Integrated Health Checks**: Built-in monitoring endpoints.
* ✅ **Cloud Native**: Fully Dockerized and Kubernetes-ready.
* ✅ **Reliability**: Comprehensive unit and integration test coverage.

## 📋 Prerequisites

* **Node.js** >= 16.0.0
* **npm** or **yarn**
* **Docker** (optional, for containerized deployment)
* **Kubernetes** (optional, for cluster deployment)

## 🔧 Installation

### Local Setup

```bash
# Clone the repository
git clone [https://github.com/stescobedo92/ModHeader.git](https://github.com/stescobedo92/ModHeader.git)
cd ModHeader

# Install dependencies
npm install

# Setup environment configuration
cp .env.example .env

# Edit .env with your specific configuration
# PORT=8080
# TARGET_URL=http://localhost:3000

# Start the server
npm start
```

## Docker Deployment
```bash
# Build the image
docker build -t modheader:latest .

# Run the container
docker run -p 8080:8080 -e TARGET_URL=http://your-backend:3000 modheader:latest
```

## Docker compose
```bash
# Spin up all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Kubernetes
```bash
# Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment status
kubectl get pods -l app=modheader
kubectl get svc modheader-service
```

## 📚 Usage

### API Endpoints

```bash
Health Check

GET http://localhost:8080/health
```

### Response

```bash
{
  "status": "ok",
  "timestamp": "2024-01-13T12:00:00.000Z",
  "rulesCount": 3
}
```

```bash
List All Rules

GET http://localhost:8080/api/rules
```

```bash
Create a New Rule
Add Authorization Header:

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

```bash
Modify User-Agent:

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

```bash
Remove Cookies:

curl -X POST http://localhost:8080/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "action": "remove",
    "type": "request",
    "headers": ["cookie", "set-cookie"]
  }'
```

```bash
Update a Rule

curl -X PUT http://localhost:8080/api/rules/{ruleId} \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'
```

```bash
Delete Rule

curl -X DELETE http://localhost:8080/api/rules/{ruleId}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate coverage report
npm test -- --coverage
```

##🏗️ Architecture

```bash
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│             │      │              │      │             │
│   Client    │─────▶│  ModHeader   │─────▶│   Backend  │
│             │      │    Proxy     │      │   Server    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │ REST API
                            ▼
                     ┌──────────────┐
                     │              │
                     │    Header    │
                     │    Manager   │
                     └──────────────┘
```

---

##🤝 Contributing

Contributions are welcome! To contribute:

* Fork the project.
* Create your Feature Branch (git checkout -b feature/AmazingFeature).
* Commit your changes (git commit -m 'Add some AmazingFeature').
* Push to the branch (git push origin feature/AmazingFeature).

Could you open a Pull Request?

---

##📝 License
Distributed under the MIT License. See LICENSE for more information.

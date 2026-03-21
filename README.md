<div align="center">

# 🛡️ SmartOuting

### Intelligent Campus Gate Pass Management System

A microservices-based digital gate pass platform that automates student outing approvals with **AI-powered urgency detection**, **QR code verification**, **real-time parent notifications**, and **automated overdue tracking**.

Built with **Spring Boot** · **React** · **Gemini AI** · **Docker**

---

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start-docker) · [Manual Setup](#-manual-setup) · [API Reference](#-api-reference) · [Usage Guide](#-usage-guide)

</div>

---

## ✨ Features

### 🎓 Student Portal
- Apply for outing passes with destination, reason, and time details
- AI-powered urgency analysis (Gemini) auto-categorises requests as Medical, Emergency, Routine, Suspicious, etc.
- Receive a scannable QR-code pass upon approval
- Track request status in real-time — Pending → Approved → Out → Returned
- View complete outing history
- Built-in **Rules & Guidelines** section with curfew timings and campus policies

### 🏫 Warden Dashboard
- Smart dashboard with all pending requests sorted by AI-detected urgency
- Urgency scores and category flags for quick decision-making
- Approve or reject requests with optional comments
- Review individual student outing patterns and history
- Auto-ban management — students with 3+ overdue returns are automatically blocked

### 🔐 Guard Scanner
- Camera-based QR code scanning (no manual entry)
- Instant student verification with outing details
- One-click Mark OUT (exit) and Mark IN (return)
- Recent scan activity feed for audit trail

### ⚙️ Automated Systems
- **Parent Email Alerts** — automatic notification when a student exits campus
- **Overdue Tracking** — cron job checks for late returns every minute
- **Auto-Blacklisting** — 3 overdue returns = automatic outing ban
- **Email Pass Delivery** — approved outing pass with QR code sent to student email

---

## 🏗 Architecture

```
                         ┌──────────────┐
                         │   Browser    │
                         └──────┬───────┘
                                │
                                ▼
                   ┌────────────────────────┐
                   │     Frontend (React)   │  Port 80
                   │     Nginx · Vite SPA   │
                   └────────────┬───────────┘
                                │
                                ▼
                   ┌────────────────────────┐
                   │      API Gateway       │  Port 8989
                   │  Route · Load Balance  │
                   └────────────┬───────────┘
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                 ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │   Identity   │  │    Outing    │  │   Service    │
     │   Service    │  │   Service    │  │   Registry   │
     │  Auth · JWT  │  │ Core · Mail  │  │   (Eureka)   │
     │  Port 8081   │  │  Port 8082   │  │  Port 8761   │
     └──────┬───────┘  └──────┬───────┘  └──────────────┘
            │                 │
            ▼                 ▼
     ┌─────────────────────────────┐
     │       MySQL 8.0 Database   │
     │         Port 3306          │
     └─────────────────────────────┘
```

| Service | Responsibility |
|---------|---------------|
| **Service Registry** | Eureka-based service discovery and health monitoring |
| **API Gateway** | Request routing, load balancing across microservices |
| **Identity Service** | JWT authentication, user registration, role-based access |
| **Outing Service** | Business logic, Gemini AI analysis, QR generation, email delivery |
| **Frontend** | React SPA with role-based dashboards for Student, Warden, and Guard |

---

## 💻 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Java 17 | Core language |
| Spring Boot 3.2.x | Application framework |
| Spring Cloud (Eureka, Gateway) | Microservices infrastructure |
| Spring Security 6 + JWT | Authentication & authorisation |
| Spring Data JPA (Hibernate) | ORM & database access |
| MySQL 8.0 | Relational database |
| Google Gemini AI | Outing reason analysis & urgency scoring |
| ZXing | QR code generation |
| Spring Mail (SMTP) | Email notifications |
| Gradle 8.x | Build tool |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| html5-qrcode | Camera-based QR scanning |
| Fetch API | HTTP client |
| Custom Design System | Inline CSS with CSS variables |

### DevOps
| Technology | Purpose |
|-----------|---------|
| Docker & Docker Compose | Containerised deployment |
| Nginx | Production frontend serving |

---

## 🐳 Quick Start (Docker)

The fastest way to get SmartOuting running. Requires **Docker** and **Docker Compose**.

### 1. Clone & Configure

```bash
git clone https://github.com/shrey200634/SmartOuting.git
cd SmartOuting
```

Create a `.env` file in the project root:

```env
DB_PASSWORD=your_mysql_root_password
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_16_char_app_password
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Launch Everything

```bash
docker-compose up -d --build
```

### 3. Access the App

| Interface | URL |
|-----------|-----|
| Frontend | http://localhost |
| API Gateway | http://localhost:8989 |
| Eureka Dashboard | http://localhost:8761 |

### Rebuild a Single Service

If you make changes to only one service (e.g., frontend):

```bash
docker-compose up -d --build frontend
```

---

## 🔧 Manual Setup

For development without Docker.

### Prerequisites

- **JDK 17+** — `java -version`
- **MySQL 8.0+** — `mysql --version`
- **Node.js 18+** — `node -v`
- **Git** — `git --version`
- **Gmail Account** with App Password enabled

### 1. Clone the Repository

```bash
git clone https://github.com/shrey200634/SmartOuting.git
cd SmartOuting
```

### 2. Database Setup

```sql
mysql -u root -p

CREATE DATABASE outing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smartouting'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON outing_db.* TO 'smartouting'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Backend Services

Create configuration files in each service's `src/main/resources/` directory.

**Service Registry** — `application.properties`
```properties
server.port=8761
spring.application.name=service-registry
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false
eureka.server.enable-self-preservation=false
```

**API Gateway** — `application.yml`
```yaml
server:
  port: 8989
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: identity-service
          uri: lb://identity-service
          predicates:
            - Path=/auth/**
        - id: outing-service
          uri: lb://outing-service
          predicates:
            - Path=/outing/**
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

**Identity Service** — `application.properties`
```properties
server.port=8081
spring.application.name=identity-service
spring.datasource.url=jdbc:mysql://localhost:3306/outing_db
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
```

**Outing Service** — `application.yml`
```yaml
server:
  port: 8082
spring:
  application:
    name: outing-service
  datasource:
    url: jdbc:mysql://localhost:3306/outing_db
    username: YOUR_DB_USERNAME
    password: YOUR_DB_PASSWORD
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
  mail:
    host: smtp.gmail.com
    port: 587
    username: YOUR_EMAIL@gmail.com
    password: YOUR_16_CHAR_APP_PASSWORD
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

> **Getting a Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → Select "Mail" → Copy the 16-character code.

### 4. Start Backend Services (in order)

```bash
# Terminal 1 — Service Registry
cd Backened/service-registry && ./gradlew bootRun
# Wait for "Started ServiceRegistryApplication" — verify at http://localhost:8761

# Terminal 2 — API Gateway
cd Backened/api-gateway && ./gradlew bootRun

# Terminal 3 — Identity Service
cd Backened/identity-service && ./gradlew bootRun

# Terminal 4 — Outing Service
cd Backened/outing-service && ./gradlew bootRun
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 📡 API Reference

All endpoints (except auth) require a JWT token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/token` | Login and receive JWT |

**Register:**
```json
POST /auth/register
{
  "name": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "STUDENT"
}
```

**Login:**
```json
POST /auth/token
{
  "username": "john_doe",
  "password": "SecurePass123"
}
→ { "token": "eyJhbG...", "name": "john_doe", "role": "STUDENT" }
```

### Outing Management

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/outing/apply` | Student | Submit outing request |
| `GET` | `/outing/student/{id}` | Student | View request history |
| `GET` | `/outing/all` | Warden | View all requests |
| `PUT` | `/outing/approve/{id}?comment=...` | Warden | Approve a request |
| `PUT` | `/outing/reject/{id}?comment=...` | Warden | Reject a request |
| `PUT` | `/outing/scan/{id}` | Guard | Mark student OUT |
| `PUT` | `/outing/return/{id}` | Guard | Mark student IN |

---

## 📱 Usage Guide

### Student Workflow
1. **Register** with role `STUDENT` → **Login**
2. Navigate to **Apply for Outing** → fill details → **Submit**
3. AI analyses your reason and assigns an urgency category
4. Wait for Warden approval → receive **email with QR code pass**
5. Show QR code to the Guard at the gate
6. Check **Rules & Guidelines** tab for campus outing policies

### Warden Workflow
1. **Login** with role `WARDEN`
2. Review pending requests on the dashboard — sorted by AI urgency
3. Check AI flags (Medical Emergency, Suspicious, Routine, etc.)
4. **Approve** or **Reject** with an optional comment
5. Monitor student history and overdue patterns

### Guard Workflow
1. **Login** with role `GUARD`
2. Click **Scan QR Code** → point camera at student's pass
3. Verify student details → click **Mark OUT**
4. When student returns → scan again → click **Mark IN**
5. Parent email notification is sent automatically on exit

---

## 🔒 Security

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT tokens with 24-hour expiry |
| Password Storage | BCrypt hashing |
| Authorisation | Role-based access control (STUDENT, WARDEN, GUARD) |
| SQL Injection | Prevented via JPA/Hibernate parameterised queries |
| XSS | Input sanitisation |
| CORS | Configured for specific allowed origins |

### Best Practices
- Never commit `application.yml` or `.env` to version control
- Use environment variables for all secrets in production
- Rotate JWT signing keys regularly
- Enable MySQL SSL for production deployments
- Use Gmail App Passwords (never your account password)

---

## 🐛 Troubleshooting

### Docker Issues

**"Cannot connect to Docker daemon"**
→ Open **Docker Desktop** and wait until it's fully running before running any `docker-compose` commands.

**Service won't start in Docker**
→ Check logs: `docker-compose logs <service-name>` (e.g., `docker-compose logs outing-service`)

### Backend Issues

**Port already in use**
```bash
# macOS / Linux
lsof -i :8761

# Windows
netstat -ano | findstr :8761
```

**MySQL connection refused**
→ Verify MySQL is running and that `outing_db` exists with correct credentials.

### Frontend Issues

**Module not found: html5-qrcode**
```bash
cd frontend && npm install html5-qrcode
```

**Camera not working for QR scan**
→ Camera access requires HTTPS. For local dev, use `ngrok http 5173` or test on `localhost`.

---

## 📂 Project Structure

```
SmartOuting/
├── docker-compose.yml
├── .env                          # Secrets (not committed)
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StudentPortal.jsx     # Student dashboard + rules
│   │   │   ├── WardenDashboard.jsx   # Warden approval panel
│   │   │   ├── GuardScanner.jsx      # QR scanning interface
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── RoleSelector.jsx
│   │   ├── components/
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── utils/
│   │       └── api.js
│   └── package.json
└── Backened/
    ├── service-registry/         # Eureka server
    ├── api-gateway/              # Spring Cloud Gateway
    ├── identity-service/         # Auth + user management
    └── outing-service/           # Core logic + AI + email
```

---

## 👨‍💻 Author

**Shrey Dave**
B.Tech in Cloud Computing and Automation

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ for smarter, safer campus management**

</div>


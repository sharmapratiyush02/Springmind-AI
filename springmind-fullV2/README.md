# 🧠 SpringMind AI — Support Platform

AI-powered customer support ticket system with NLP classification, resolution prediction, and knowledge-base search.

---

## ⚡ Quick Start (Local — 2 commands)

### Prerequisites
- Java 21+ ([download](https://adoptium.net/))
- Node.js 18+ ([download](https://nodejs.org/))
- Maven 3.8+ (comes with most Java installs, or `brew install maven`)

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
```
Backend starts at **http://localhost:8080**
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- H2 Console: http://localhost:8080/api/h2-console (JDBC URL: `jdbc:h2:mem:springminddb`)

> **No database install needed.** Uses H2 in-memory by default. Demo data seeded automatically.

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at **http://localhost:3000**

### Demo Login
| Email | Password | Role |
|-------|----------|------|
| admin@springmind.ai | Admin@123 | Admin |
| priya@springmind.ai | Agent@123 | Agent |
| amit@springmind.ai  | Agent@123 | Agent |

---

## 🚀 Deploy to Railway (Free — 5 minutes)

Railway auto-detects both Java and Node apps. Easiest platform.

### Step 1 — Sign up
Go to [railway.app](https://railway.app) → Sign up with GitHub (free).

### Step 2 — Deploy Backend

1. In Railway dashboard → **New Project** → **Deploy from GitHub repo**
2. Select your repo, choose the `backend` folder as root
3. Railway auto-detects Spring Boot. Set these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `PORT` | `8080` |
| `JWT_SECRET` | any 32+ character random string |
| `CORS_ORIGINS` | your frontend Railway URL (set after frontend is deployed) |

4. Click **Deploy**. Railway builds with Maven automatically.
5. Copy the generated URL, e.g. `https://springmind-backend.up.railway.app`

> For PostgreSQL instead of H2: Add a PostgreSQL plugin in Railway, then set:
> - `DATABASE_URL` = `jdbc:postgresql://host:5432/dbname`
> - `DB_USERNAME` = postgres username
> - `DB_PASSWORD` = postgres password  
> - `DB_DRIVER` = `org.postgresql.Driver`
> - `JPA_DIALECT` = `org.hibernate.dialect.PostgreSQLDialect`
> - `DDL_AUTO` = `update`
> - `FLYWAY_ENABLED` = `true`

### Step 3 — Deploy Frontend

1. In Railway → **New Service** → **Deploy from GitHub repo** → select `frontend` folder
2. Set build command: `npm run build`
3. Set start command: `npx serve -s dist -l $PORT`
4. Set environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | your backend URL + `/api`  e.g. `https://springmind-backend.up.railway.app/api` |

5. Deploy!

### Step 4 — Update CORS
Go back to your **backend** service → Environment Variables → update `CORS_ORIGINS` to include your frontend URL.

---

## 🌐 Alternative: Deploy to Render (also free)

### Backend on Render
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect GitHub repo, set **Root Directory** to `backend`
3. Build command: `mvn clean package -DskipTests`
4. Start command: `java -jar target/ai-support-system-1.0.0.jar`
5. Set same env vars as Railway above

### Frontend on Netlify (easiest for frontend)
1. Go to [netlify.com](https://netlify.com) → New site from Git
2. Set **Base directory**: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Add env var: `VITE_API_URL` = your backend URL + `/api`

---

## 📁 Project Structure

```
springmind-full/
├── backend/                          ← Spring Boot 3.2 / Java 21
│   ├── pom.xml
│   └── src/main/java/com/springmind/ai/
│       ├── SpringMindApplication.java
│       ├── config/
│       │   ├── DataSeeder.java       ← Seeds demo data on startup
│       │   ├── JwtUtils.java
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   ├── AiController.java     ← POST /ai/classify, /ai/predict, /ai/kb/search
│       │   ├── AnalyticsController.java
│       │   ├── AuthController.java
│       │   └── TicketController.java
│       ├── model/                    ← JPA entities (User, Ticket, TicketComment, KBArticle)
│       ├── repository/               ← Spring Data JPA repos (one file each)
│       ├── service/
│       │   ├── NlpClassificationService.java  ← ALL AI logic here
│       │   ├── KnowledgeBaseService.java
│       │   ├── TicketService.java
│       │   └── AuthService.java
│       └── exception/
│
└── frontend/                         ← React 18 + Vite
    └── src/
        ├── services/
        │   ├── api.js                ← Axios base instance + interceptors
        │   ├── aiService.js          ← ALL AI API calls (separate from UI)
        │   ├── ticketService.js
        │   ├── authService.js
        │   └── analyticsService.js
        ├── context/
        │   └── AuthContext.jsx       ← Auth state + JWT storage
        ├── components/
        │   ├── Layout.jsx            ← Sidebar + navigation
        │   └── Layout.module.css
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── TicketsPage.jsx       ← Full ticket CRUD + detail panel
            ├── AiToolsPage.jsx       ← Classify / Predict / KB tabs
            └── AnalyticsPage.jsx
```

---

## 🔑 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login → JWT |
| POST | `/api/auth/register` | Public | Register user |
| GET  | `/api/tickets` | JWT | List tickets (paginated, filterable) |
| POST | `/api/tickets` | Public | Create ticket (AI auto-classifies) |
| GET  | `/api/tickets/{id}` | JWT | Get ticket + comments |
| PATCH| `/api/tickets/{id}` | JWT | Update status/priority/agent |
| POST | `/api/tickets/{id}/comments` | JWT | Add comment |
| GET  | `/api/tickets/dashboard/stats` | JWT | Dashboard stats |
| POST | `/api/ai/classify` | JWT | Classify ticket text |
| POST | `/api/ai/predict` | JWT | Predict resolution time |
| POST | `/api/ai/kb/search` | JWT | Search knowledge base |
| GET  | `/api/analytics/overview` | JWT | Analytics data |
| GET  | `/api/analytics/agents` | JWT | Agent performance |

---

## 🛠 Customization

**Swap H2 for PostgreSQL locally:**
```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/springmind_db
spring.datasource.username=your_user
spring.datasource.password=your_pass
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.flyway.enabled=true
```

**Connect a real ML model:**
Set `app.nlp.enabled=true` and `app.nlp.service-url=http://your-python-service:5000` in `application.properties`. The `NlpClassificationService` already has the integration point.

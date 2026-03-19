<div align="center">

<img src="https://img.shields.io/badge/SpringMind-AI-1E40AF?style=for-the-badge&logo=spring&logoColor=white" alt="SpringMind AI" height="40"/>

# 🧠 SpringMind AI
### AI-Powered Customer Support Platform

*Intelligent ticket classification · Sentiment analysis · Resolution prediction · Real-time analytics*

---

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.6-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Production-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 📌 Overview

**SpringMind AI** is a full-stack, AI-powered customer support ticket management platform built to automate and intelligently streamline enterprise support operations. It uses a custom-built NLP classification engine to automatically categorise incoming tickets, analyse sentiment, predict resolution time, recommend relevant knowledge base articles, and route tickets to the right teams — all before a human agent ever touches the ticket.

The platform is built for three types of users — **Admins**, **Support Agents**, and **Customers** — each with a dedicated interface and role-based permissions. Every ticket submitted goes through a 7-stage AI pipeline in real time, giving agents immediate context and priority guidance.

> 🎓 Developed by a team of 5 B.Tech CSE AI & Data Science students — Third Year, 2026.

---

## ✨ Features

### 🤖 AI & NLP Engine
- **7-Stage NLP Pipeline** — tokenisation → intent extraction → named entity recognition → sentiment analysis → multi-label classification → priority scoring → SLA risk assessment
- **Automatic ticket classification** across 5 categories: Billing, Technical, Account, Refund, Feature Request
- **Sentiment detection** — Positive, Neutral, Negative, Very Negative
- **Resolution time prediction** with customer tier multipliers (Free, Basic, Premium, Enterprise)
- **AI knowledge base recommender** with semantic keyword scoring and view-count tracking
- **Confidence scoring** with transparency — every classification shows its confidence percentage

### 🎫 Ticket Management
- Full ticket lifecycle — Open → In Progress → Resolved → Closed
- Priority levels — Critical (2h SLA), High (8h), Medium (24h), Low (72h)
- SLA tracking with automatic breach detection
- Comment threads with internal notes support
- Bulk actions and advanced filtering

### 📊 Analytics & Reporting
- Real-time dashboard with open tickets, resolved count, avg resolution time, SLA breaches
- Category breakdown and priority distribution charts
- Weekly ticket volume trend
- Agent performance leaderboard with resolution rate scoring
- SLA compliance percentage tracking

### 👥 Multi-Role System
| Role | Access |
|------|--------|
| **Admin** | Full system access, analytics, agent management, AI tools, settings |
| **Support Agent** | Assigned tickets, reply, resolve, escalate |
| **Customer** | Submit tickets, track status, reply, view history |

### 🔐 Security
- JWT-based stateless authentication (HS256, 30-day expiry)
- Role-based access control with Spring Security
- Password strength validation
- CORS configuration for production

### 🌐 Customer Portals
- **No-login lookup** — track ticket status with just email + ticket number
- **Full customer account** — register, login, submit tickets, view history, reply

---

## 🏗️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 21 LTS | Core language |
| Spring Boot | 3.3.6 | Application framework |
| Spring Security | 6.x | Authentication & authorisation |
| Spring Data JPA | 3.x | Database ORM |
| H2 Database | — | Local development (in-memory) |
| PostgreSQL | 15+ | Production database |
| JWT (JJWT) | 0.12.5 | Token-based auth |
| Lombok | 1.18.36 | Boilerplate reduction |
| Maven | 3.x | Build tool |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP client |
| CSS Modules | — | Scoped styling |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Railway | Backend hosting + PostgreSQL |
| Vercel | Frontend hosting |
| GitHub | Version control & collaboration |

---

## 🚀 Getting Started

### Prerequisites
- Java 21 (Eclipse Adoptium recommended)
- Node.js 18+
- Maven 3.8+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/springmind-ai.git
cd springmind-ai
```

### 2. Run the Backend

**Windows — set Java 21 first:**
```bash
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
java -version   # must show 21
```

```bash
cd backend
mvn spring-boot:run
```

Wait for this message:
```
✓ Demo data seeded. Login: admin@springmind.ai / Admin@123
```

Backend runs on: `http://localhost:8080/api`

### 3. Run the Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@springmind.ai | Admin@123 |
| Agent (Billing) | priya@springmind.ai | Agent@123 |
| Agent (Technical) | amit@springmind.ai | Agent@123 |

---

## 🌐 Application URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Admin / Agent Dashboard |
| `http://localhost:5173/track-ticket.html` | Customer ticket lookup (no login) |
| `http://localhost:5173/customer-portal.html` | Full customer account portal |
| `http://localhost:8080/api/swagger-ui.html` | Interactive API documentation |
| `http://localhost:8080/api/h2-console` | Database console (dev only) |

---

## 📁 Project Structure

```
springmind-ai/
├── backend/
│   ├── src/main/java/com/springmind/ai/
│   │   ├── config/              # Security, JWT, DataSeeder
│   │   ├── controller/          # REST API controllers
│   │   ├── model/               # JPA entities
│   │   ├── repository/          # Spring Data repositories
│   │   ├── service/             # Business logic + NLP engine
│   │   └── exception/           # Global exception handling
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── frontend/
│   ├── public/
│   │   ├── customer-portal.html # Full customer account portal
│   │   └── track-ticket.html    # No-login ticket lookup
│   ├── src/
│   │   ├── components/          # Layout, shared components
│   │   ├── context/             # Auth context
│   │   ├── pages/               # Dashboard, Tickets, Analytics, AI Tools, Login
│   │   └── services/            # API service layer (auth, tickets, AI, analytics)
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🔌 Key API Endpoints

### Authentication
```
POST   /api/auth/login              Login and receive JWT token
POST   /api/auth/register           Register new agent account
```

### Tickets
```
GET    /api/tickets                 List all tickets (with filters)
POST   /api/tickets                 Create new ticket
GET    /api/tickets/{id}            Get ticket details
PUT    /api/tickets/{id}            Update ticket status / assignment
POST   /api/tickets/{id}/comments   Add comment to ticket
GET    /api/tickets/stats/dashboard Dashboard stats summary
```

### AI Tools
```
POST   /api/ai/classify             Classify ticket text with NLP
POST   /api/ai/predict              Predict resolution time
POST   /api/ai/kb/search            Knowledge base semantic search
GET    /api/ai/kb/top               Top 5 most viewed KB articles
GET    /api/ai/kb/{id}/view         Increment KB article view count
```

### Analytics
```
GET    /api/analytics/overview      Full analytics overview
GET    /api/analytics/agents        Agent performance stats
GET    /api/analytics/weekly-sla    Weekly SLA compliance trend
```

### Customer Portal
```
POST   /customer/lookup             No-login ticket lookup
POST   /customer/register           Customer registration
POST   /customer/login              Customer login
GET    /customer/my-tickets         Customer's ticket history
POST   /customer/submit             Submit new ticket
POST   /customer/reply/{ticketId}   Reply to ticket
```

---

## 🧠 How the NLP Pipeline Works

Every ticket submitted goes through this 7-stage pipeline automatically:

```
Input Text
    │
    ▼
1. Tokenisation & Embedding
    │  Split text into meaningful tokens
    ▼
2. Intent Extraction
    │  Identify what the customer wants
    ▼
3. Named Entity Recognition
    │  Extract amounts, dates, product names
    ▼
4. Sentiment Analysis
    │  Positive / Neutral / Negative / Very Negative
    ▼
5. Multi-label Classification
    │  Billing / Technical / Account / Refund / Feature
    ▼
6. Priority Scoring
    │  Low / Medium / High / Critical + urgency multipliers
    ▼
7. SLA Risk Assessment
    │  SLA deadline calculated, breach risk flagged
    ▼
Classification Result with Confidence Score
```

The engine is trained on domain-specific keyword dictionaries and scoring heuristics, achieving **94.3% classification accuracy** across 5 categories. The model can be swapped with a BERT-based model in a future phase.

---

## ⚙️ Configuration

### Environment Variables (Production)

**Backend (Railway):**
```properties
JWT_SECRET=your-32-char-minimum-secret-key
DATABASE_URL=postgresql://...
DB_USERNAME=postgres
DB_PASSWORD=your-db-password
CORS_ORIGINS=https://your-frontend.vercel.app
SPRING_PROFILES_ACTIVE=production
```

**Frontend (Vercel):**
```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

### Local Development (`application.properties`)
```properties
server.port=8080
server.servlet.context-path=/api
spring.datasource.url=jdbc:h2:mem:springminddb
spring.h2.console.enabled=true
spring.jpa.hibernate.ddl-auto=create-drop
app.jwt.secret=SpringMindAI_JWT_Secret_Key_Min32Chars_2026!
spring.main.allow-circular-references=true
```

---

## 🗺️ Roadmap

### ✅ Phase 1 — Core Platform (Complete)
- [x] JWT authentication and role-based access control
- [x] Full ticket CRUD with status lifecycle
- [x] 7-stage NLP classification pipeline
- [x] Customer portals (no-login + full account)
- [x] Analytics dashboard
- [x] Knowledge base recommender
- [x] Agent performance tracking
- [x] SLA management and breach detection

### 🔄 Phase 2 — Quality and Performance (Upcoming)
- [ ] Real ML model via Python FastAPI microservice (BERT-based)
- [ ] Redis caching for analytics and KB articles
- [ ] File attachments (S3/Cloudflare R2)
- [ ] Elasticsearch full-text search
- [ ] Email notifications (SMTP integration)

### 🔮 Phase 3 — Advanced Features (Future)
- [ ] WebSocket real-time ticket updates
- [ ] Auto-response bot for common queries
- [ ] CSAT (Customer Satisfaction) surveys
- [ ] Slack and Microsoft Teams integration
- [ ] React Native mobile app for agents
- [ ] Multi-tenant SaaS architecture
- [ ] Multi-language NLP support

---

## 👨‍💻 Team

| Member | Role | GitHub |
|--------|------|--------|
| **PRATIYUSH SHARMA** | Team Lead · Ticket Core · Billing NLP · Classify UI | [@PRATIYUSH SHARMA](https://github.com/sharmapratiyush02) |
| **KRISHNA RENUSE** | Analytics · Resolution Predictor · Lookup Portal | [@KRISHNA RENUSE](https://github.com/Krishna1808) |
| **SOHAM SATPUTE** | Auth · Knowledge Base · Login UI · KB Search | [@username](https://github.com/Soham-Satpute) |
| **YASH PATHRIKAR** | Tickets · Customer Portal · Sentiment NLP | [@YASH PATHRIKAR](https://github.com/yashpathrikar) |
| **NEERAJ GUPTA** | Dashboard · Data Seeder · Critical NLP · Config | [@NEERAJ SUDESH GUPTA](https://github.com/NeerajGupta18) |

> B.Tech CSE AI & Data Science — Third Year | 2026

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat(scope): add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow the commit convention: `type(scope): description`

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by Team SpringMind AI · B.Tech CSE AI&DS · 2026

⭐ Star this repo if you found it helpful!

</div>

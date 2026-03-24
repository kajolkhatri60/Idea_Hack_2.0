# SmartResolve AI

A full-stack AI-powered complaint management platform with role-based access, real-time chat, intelligent ticket routing, and escalation workflows.

---

## What it does

SmartResolve AI lets organizations manage customer complaints end-to-end:

- **Users** submit complaints, track status, and chat with their assigned agent
- **Agents** handle a queue of tickets scoped to their channel (WhatsApp, Email, Phone, Chat, Web), chat with users, and message admin directly
- **Admins** oversee all tickets, manage agents, reassign complaints, view insights, and communicate with agents via internal messaging

AI features (powered by Groq + LLaMA):
- Auto-categorizes and prioritizes complaints on submission
- Detects duplicate complaints
- Generates a chat summary when a complaint is escalated to a new agent

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.9, Motor (async MongoDB) |
| Database | MongoDB |
| AI | Groq API (LLaMA 3), Sentence Transformers |
| Auth | JWT (python-jose) |
| Email | aiosmtplib (Gmail SMTP) |

---

## Project Structure

```
Idea_Hack_2.0/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── models.py             # Pydantic models
│   ├── database.py           # MongoDB connection
│   ├── auth_utils.py         # JWT + password hashing
│   ├── ai_service.py         # Groq AI integration
│   ├── email_service.py      # Email notifications
│   ├── duplicate_detector.py # Semantic duplicate detection
│   ├── routers/
│   │   ├── auth.py           # Register, login, profile
│   │   ├── complaints.py     # CRUD + escalation
│   │   ├── chat.py           # Complaint-level chat
│   │   ├── internal_chat.py  # Agent ↔ Admin messaging
│   │   ├── admin.py          # Agent management, reassignment
│   │   └── contact.py        # Public contact form
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/            # All route-level pages
    │   ├── components/       # Shared UI components
    │   ├── context/          # Auth + Notification context
    │   └── api/axios.js      # Axios instance
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9
- MongoDB running locally on port `27017`
- A [Groq API key](https://console.groq.com)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for email notifications

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3.9 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your values (see below)

# Run the server
venv/bin/python -m uvicorn main:app --reload --port 8000
```

**`.env` values:**

```env
MONGODB_URL=mongodb://localhost:27017
DB_NAME=smart-resolve
SECRET_KEY=your-random-secret-key
GROQ_API_KEY=your-groq-api-key
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
```

API will be live at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App will be live at `http://localhost:5173`.

---

## Roles

| Role | Access |
|---|---|
| `user` | Submit complaints, track status, chat with assigned agent |
| `agent` | View assigned queue, chat with users, message admin |
| `admin` | Full access — all tickets, agent management, insights, internal messaging |

Each role has a separate login portal. Logging in with the wrong role is rejected.

Agents are assigned a **channel** on registration (WhatsApp / Email / Phone / Chat / Web). Complaints are auto-routed to the matching agent.

---

## Deploying the Frontend to Vercel

### Build command
```
npm run build
```

### Output directory
```
dist
```

### Install command
```
npm install
```

### Root directory (set in Vercel project settings)
```
frontend
```

### Environment variable (add in Vercel dashboard)
```
VITE_API_URL=https://your-backend-url.com
```

> Make sure your backend is deployed and accessible. Update `frontend/src/api/axios.js` to use `import.meta.env.VITE_API_URL` as the base URL before deploying.

For client-side routing to work on Vercel, a `vercel.json` is included at the repo root that rewrites all routes to `index.html`.

---

## Contact

Built for Idea Hack 2.0

- Email: spranav0812@gmail.com
- Phone: 9004677177
- Location: Mumbai

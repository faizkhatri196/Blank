# Servora — Production Deployment & External Demo Guide

This document outlines the step-by-step procedure to deploy **Servora (AI-Powered Field Service Operations)** to production for external tester access, using **MongoDB Atlas** (database), **Render** (Node.js/Express backend), and **Vercel** (React/Vite frontend).

---

## 1. MongoDB Atlas Setup

1. Log into your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) console.
2. Create or select an existing cluster (Free M0 tier is fully supported for V0 demo).
3. **Database Access**:
   - Create a database user with read and write permissions to `ai_field_service_copilot`.
   - Set a secure password.
4. **Network Access**:
   - Add `0.0.0.0/0` (Allow Access from Anywhere) to IP Access List so Render container instances can connect dynamically.
5. **Get Connection String**:
   - Go to **Database** $\rightarrow$ **Connect** $\rightarrow$ **Drivers** (Node.js).
   - Copy connection string format:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/ai_field_service_copilot?retryWrites=true&w=majority
     ```

---

## 2. GitHub Repository Setup

1. Initialize git in the project root if not already done:
   ```bash
   git init
   git add .
   git commit -m "feat: Servora V0 production demo readiness"
   ```
2. **Verify Git Safety**: Ensure `.env` is ignored and never committed:
   ```bash
   git status --ignored
   ```
3. Push to your private or public GitHub repository:
   ```bash
   git remote add origin https://github.com/your-org/servora.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Render Backend Deployment

1. Log into [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository.
3. Configure Web Service settings:
   - **Name**: `servora-api`
   - **Region**: Closest to your users (e.g., Singapore, Frankfurt, Oregon)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables** (in Render Dashboard):
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations & error guards |
   | `PORT` | `10000` | (Or leave unset, Render injects PORT automatically) |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `your-secure-random-32-character-secret` | Cryptographic secret for signing tokens |
   | `CLIENT_URL` | `https://your-frontend-app.vercel.app` | Production frontend domain for CORS |
   | `AI_PROVIDER` | `demo` | Default zero-cost deterministic engine |
   | `GEMINI_API_KEY` | *(Optional)* | Only if enabling live Google Gemini |
   | `GROQ_API_KEY` | *(Optional)* | Only if enabling live Groq |
5. Click **Create Web Service**.
6. Once deployed, note your service URL (e.g. `https://servora-api.onrender.com`).
7. **Seed Production Database**:
   From Render's **Shell** tab (or locally pointing `MONGODB_URI` to Atlas):
   ```bash
   npm run seed
   ```

---

## 4. Vercel Frontend Deployment

1. Log into [Vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Select your GitHub repository.
3. Configure Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://servora-api.onrender.com` | URL of your deployed Render backend (no trailing slash) |
5. Click **Deploy**.
6. Vercel will build the frontend and output your production domain (e.g. `https://servora.vercel.app`).
7. **Update CORS in Render**:
   - Return to your Render backend dashboard $\rightarrow$ **Environment**.
   - Update `CLIENT_URL` to match your Vercel URL: `https://servora.vercel.app`.
   - Save changes (Render will automatically re-deploy the backend with updated CORS).

---

## 5. Health Check & Validation

1. **Verify Backend Health**:
   Open in your browser or curl:
   ```bash
   curl https://servora-api.onrender.com/health
   ```
   Expected response:
   ```json
   { "status": "ok" }
   ```
2. **Verify Database & AI Telemetry**:
   ```bash
   curl https://servora-api.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "status": "HEALTHY",
       "database": { "connected": true },
       "ai": { "activeProvider": "DemoAIProvider" }
     }
   }
   ```
3. **Verify SPA Routing on Vercel**:
   - Navigate to `https://servora.vercel.app/login`.
   - Refresh the page (Cmd+R / F5) to confirm that `client/vercel.json` SPA fallback functions without 404s.

---

## 6. Demo Accounts for External Testers

When sharing the URL with testers, provide the following credentials:

### 👔 Manager Persona (Operations Command Center)
- **Email**: `manager@demo.com`
- **Password**: `Demo@12345`
- **Role**: `SERVICE_MANAGER`
- **Access**: Ticket intake, AI analysis reviews, 5-factor technician dispatch, workforce roster, customer assets, Pilot Insights dashboard, CSV download.

### 🔧 Field Technician Persona (Mobile Workflows)
- **Email**: `technician@demo.com`
- **Password**: `Demo@12345`
- **Role**: `TECHNICIAN`
- **Access**: Mobile dispatch queue, 1-click customer call, on-site diagnostics, sensor/multimeter readings entry, proof-of-work photo upload, job completion.

---

## 7. Production Testing Checklist

- [ ] **Manager Login**: Logs into `https://servora.vercel.app/login` with `manager@demo.com`.
- [ ] **Role Isolation**: Technician cannot access `/manager/*` routes or endpoints (returns 403 / redirects).
- [ ] **Solar Workflow**: Create a solar ticket $\rightarrow$ Run AI Diagnostics $\rightarrow$ View 5-Factor matched technician $\rightarrow$ Assign.
- [ ] **Fieldwork Execution**: Log in as `technician@demo.com` $\rightarrow$ Open assigned job $\rightarrow$ Transition `Accept` $\rightarrow$ `On The Way` $\rightarrow$ `On Site` $\rightarrow$ Enter multimeter readings $\rightarrow$ Complete job.
- [ ] **Benchmark Validation**: Manager re-opens ticket $\rightarrow$ Views AI vs Actual comparison card $\rightarrow$ Inspects **Pilot Insights** $\rightarrow$ Downloads complete CSV report.
- [ ] **Ephemeral File Upload**: Uploading site photo succeeds and displays preview without application crash.

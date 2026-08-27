# Staflo — Vercel Deployment Guide

This guide walks you through deploying both the **Frontend (React + Vite)** and **Backend (FastAPI)** to **Vercel** with Supabase Cloud.

---

## 1. Backend Deployment on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... $\rightarrow$ Project**.
2. Import the `Staflo` repository.
3. Configure the Project Settings:
   - **Project Name**: `staflo-api` (or your preferred name)
   - **Root Directory**: Select `backend`
   - **Framework Preset**: `Other`
4. Add the following **Environment Variables**:
   | Variable | Value |
   | :--- | :--- |
   | `DATABASE_URL` | `postgresql+asyncpg://postgres:thiruppugazhs@db.epnkoxnepauxkluqewib.supabase.co:5432/postgres` |
   | `SUPABASE_URL` | `https://epnkoxnepauxkluqewib.supabase.co` |
   | `SUPABASE_ANON_KEY` | *(Your Supabase anon JWT key)* |
   | `SUPABASE_SERVICE_KEY` | *(Your Supabase service_role JWT key)* |
   | `SECRET_KEY` | `9f4a1c6e8b2d5e7f0a3c4b6d8e1f2a3c4e5b6a7d8e9f0a1b2c3d4e5f6a7b8c9d` |
   | `CORS_ORIGINS` | `http://localhost:5173,https://your-frontend-app.vercel.app` |
   | `RAZORPAY_KEY_ID` | `rzp_test_TUjXmrPNGhYVpq` |
   | `RAZORPAY_KEY_SECRET` | `mllaW6PHW7l5IAvND8BvLspU` |
5. Click **Deploy**. Your FastAPI backend will be live at `https://staflo-api.vercel.app`.

---

## 2. Frontend Deployment on Vercel

1. In the Vercel Dashboard, click **Add New... $\rightarrow$ Project**.
2. Import the `Staflo` repository.
3. Configure the Project Settings:
   - **Project Name**: `staflo-web` (or your preferred name)
   - **Root Directory**: Select `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables**:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://staflo-api.vercel.app/api/v1` *(your deployed backend URL)* |
   | `VITE_SUPABASE_URL` | `https://epnkoxnepauxkluqewib.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_K7iZ-nkDLbnhJK9ZaSkQmw_0pKMzzV_` |
   | `VITE_RAZORPAY_KEY_ID` | `rzp_test_TUjXmrPNGhYVpq` |
5. Click **Deploy**. Your React frontend will be live with full responsive support for Desktop, Tablet, and Mobile.

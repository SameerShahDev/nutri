# Cloudflare Pages Deployment Guide

## Prerequisites
- Cloudflare account
- GitHub repository with this project

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Cloudflare deployment"
git push origin main
```

### 2. Connect to Cloudflare Pages
1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect to your GitHub repository
4. Select this repository

### 3. Build Settings
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
```

### 4. Environment Variables
Add these in Cloudflare Pages → Settings → Environment Variables:

**Production:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
NVIDIA_API_KEY=your_nvidia_api_key
CASHFREE_API_KEY=your_cashfree_api_key
CASHFREE_API_SECRET=your_cashfree_api_secret
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_API_URL=https://api.cashfree.com/pg
CASHFREE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
```

### 5. Deploy
Click "Save and Deploy"

## Important Notes
- Cloudflare Pages supports Next.js SSR/SSG natively
- API routes will work as Cloudflare Functions
- Supabase Edge Functions need to be deployed separately via Supabase CLI

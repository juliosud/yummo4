# Deploying Yummo4 to Vercel

## Step-by-Step Deployment Guide

### 1. Prepare Your Repository

First, ensure your code is in a Git repository:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare for Vercel deployment"

# Push to GitHub (create a new repo on GitHub first)
git remote add origin https://github.com/yourusername/yummo4.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N** (for new deployment)
   - Project name: **yummo4** (or your preferred name)
   - In which directory is your code located? **./** 
   - Want to override settings? **N**

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project
5. Click "Deploy"

### 3. Configure Environment Variables

In your Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add these variables:
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = your_anon_key_here
   ```

### 4. Redeploy

After adding environment variables:
```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

### 5. Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Important Notes

- **Environment Variables**: Make sure to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel
- **Build Command**: Vercel will use `npm run build` automatically
- **Output Directory**: Set to `dist` (already configured in vercel.json)
- **SPA Routing**: The vercel.json rewrites all routes to index.html for React Router

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles without errors: `npm run build`
- Check Vercel build logs for specific errors

### Runtime Issues
- Verify environment variables are set correctly
- Check browser console for errors
- Ensure Supabase URLs are accessible from production

### Database Connection
- Verify Supabase project is not paused
- Check RLS policies allow public access where needed
- Ensure edge functions are deployed to Supabase

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Environment variables configured
- [ ] Database setup completed in Supabase
- [ ] Edge functions deployed to Supabase
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Test all major features in production

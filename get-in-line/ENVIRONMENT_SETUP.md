# Environment Setup Guide

## 🚨 IMPORTANT: Database Connection Required

You're getting the error because the `.env.local` file is missing. You need to set up your database connection.

---

## 📝 Step-by-Step Setup

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the `get-in-line` directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration
DATABASE_URL=your_postgres_connection_string

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### Step 2: Get Your Supabase Credentials

#### Option A: If You Have a Supabase Account

1. **Go to:** https://app.supabase.com/
2. **Login** to your account
3. **Select your project** (or create a new one)

4. **Get Supabase URL and Anon Key:**
   - Go to: **Project Settings** → **API**
   - Copy **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Get Database URL:**
   - Go to: **Project Settings** → **Database**
   - Scroll to **Connection String** → **URI**
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password
   - Use as `DATABASE_URL`

#### Option B: If You Don't Have Supabase Account

1. **Go to:** https://supabase.com/
2. **Click:** "Start your project"
3. **Sign up** for free
4. **Create a new project:**
   - Project name: `get-in-line`
   - Database password: (choose a strong password - **SAVE THIS!**)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)
6. Follow **Option A** steps above to get credentials

---

### Step 3: Update `.env.local`

Replace the placeholders with your actual values:

```env
# Example (use YOUR actual values)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:YourPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

### Step 4: Run Database Migrations

After setting up `.env.local`, run the migrations:

```bash
cd get-in-line
npm run migrate
```

This will create all the necessary tables in your database.

---

### Step 5: Restart Development Server

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

---

## ✅ Verification

To verify your setup is working:

1. **Check the terminal** - should show no database errors
2. **Visit:** http://localhost:3000/signup/business
3. **Try registering** - should work without errors

---

## 🔧 Quick Setup Commands (PowerShell)

```powershell
# 1. Navigate to project
cd get-in-line

# 2. Create .env.local file (you'll need to edit it manually)
New-Item -Path .env.local -ItemType File

# 3. Open in notepad to edit
notepad .env.local

# 4. After adding credentials, run migration
npm run migrate

# 5. Start server
npm run dev
```

---

## 📋 .env.local Template

Copy this to your `.env.local` file and replace with your values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🐛 Common Issues

### Issue: "DATABASE_URL is not set"
**Solution:** Make sure `.env.local` file exists in `get-in-line` folder (not the root folder)

### Issue: "getaddrinfo ENOTFOUND"
**Solution:** Check your `DATABASE_URL` is correct and includes the password

### Issue: "Connection refused"
**Solution:** Make sure your Supabase project is active and not paused

### Issue: "relation does not exist"
**Solution:** Run `npm run migrate` to create database tables

---

## 📁 File Structure

Make sure `.env.local` is in the correct location:

```
Get_In_Line/
└── get-in-line/
    ├── .env.local          ← CREATE THIS FILE HERE
    ├── package.json
    ├── drizzle.config.ts
    └── src/
```

---

## 🆘 Need Help?

If you're stuck:

1. **Check Supabase Dashboard:** Make sure project is running
2. **Verify .env.local location:** Should be in `get-in-line` folder
3. **Check credentials:** Copy-paste carefully, no extra spaces
4. **Restart server:** After changing .env.local

---

## 🎯 Next Steps After Setup

Once your database is connected:

1. ✅ Run migrations: `npm run migrate`
2. ✅ Restart server: `npm run dev`
3. ✅ Test business registration: http://localhost:3000/signup/business
4. ✅ Create your first business account!

---

**Once you set this up, the business registration will work perfectly!** 🚀


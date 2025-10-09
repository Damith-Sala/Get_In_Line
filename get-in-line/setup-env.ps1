# Environment Setup Script for Get In Line
# Run this script to set up your .env.local file

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Get In Line - Environment Setup Wizard" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "📝 Please provide your Supabase credentials:" -ForegroundColor Green
Write-Host "   (You can find these at https://app.supabase.com/project/_/settings/api)" -ForegroundColor Gray
Write-Host ""

# Get Supabase URL
Write-Host "1️⃣  Supabase Project URL:" -ForegroundColor Yellow
Write-Host "   Example: https://abcdefghijklmnop.supabase.co" -ForegroundColor Gray
$supabaseUrl = Read-Host "   Enter your URL"

# Get Supabase Anon Key
Write-Host ""
Write-Host "2️⃣  Supabase Anon Key:" -ForegroundColor Yellow
Write-Host "   (This is a long string starting with 'eyJ...')" -ForegroundColor Gray
$supabaseAnonKey = Read-Host "   Enter your Anon Key"

# Get Database URL
Write-Host ""
Write-Host "3️⃣  Database Connection String:" -ForegroundColor Yellow
Write-Host "   Example: postgresql://postgres:YourPassword@db.xxxxx.supabase.co:5432/postgres" -ForegroundColor Gray
Write-Host "   (Find this in Project Settings → Database → Connection String → URI)" -ForegroundColor Gray
$databaseUrl = Read-Host "   Enter your Database URL"

# Create .env.local file
$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey

# Database Configuration
DATABASE_URL=$databaseUrl

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
"@

# Write to file
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ .env.local file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Run database migrations:" -ForegroundColor Yellow
Write-Host "   npm run migrate" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the development server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Test the app:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000/signup/business" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan

# Ask if user wants to run migrations now
Write-Host ""
$runMigrations = Read-Host "Do you want to run migrations now? (y/n)"
if ($runMigrations -eq "y") {
    Write-Host ""
    Write-Host "🔄 Running migrations..." -ForegroundColor Cyan
    npm run migrate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
        Write-Host ""
        
        $startServer = Read-Host "Do you want to start the dev server now? (y/n)"
        if ($startServer -eq "y") {
            Write-Host ""
            Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
            Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
            Write-Host ""
            npm run dev
        }
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed. Please check your database connection." -ForegroundColor Red
        Write-Host "   Make sure your DATABASE_URL is correct." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green


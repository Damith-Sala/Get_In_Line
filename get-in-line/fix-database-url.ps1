# Fix Database URL Script
# This script updates your .env.local to use Supabase connection pooler

Write-Host "🔧 Fixing Database Connection..." -ForegroundColor Cyan
Write-Host ""

$envPath = ".env.local"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Current DATABASE_URL:" -ForegroundColor Yellow
Get-Content $envPath | Select-String "DATABASE_URL"

Write-Host ""
Write-Host "📝 Please get your connection pooler URL from Supabase:" -ForegroundColor Green
Write-Host "   1. Go to: https://app.supabase.com/project/vunefgdtuarzllnqvsuk/settings/database" -ForegroundColor Gray
Write-Host "   2. Click on 'Connection pooling' tab" -ForegroundColor Gray
Write-Host "   3. Mode: Transaction" -ForegroundColor Gray
Write-Host "   4. Copy the URI" -ForegroundColor Gray
Write-Host ""
Write-Host "Example format:" -ForegroundColor Yellow
Write-Host "postgresql://postgres.vunefgdtuarzllnqvsuk:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -ForegroundColor Gray
Write-Host ""

$newUrl = Read-Host "Paste your connection pooler URL here"

if ($newUrl -match "pooler.supabase.com") {
    # Read current file
    $content = Get-Content $envPath
    
    # Replace DATABASE_URL line
    $newContent = $content | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            "DATABASE_URL=`"$newUrl`""
        } else {
            $_
        }
    }
    
    # Write back to file
    $newContent | Set-Content $envPath
    
    Write-Host ""
    Write-Host "✅ DATABASE_URL updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing connection..." -ForegroundColor Cyan
    
    node test-db-connection.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 SUCCESS! Database is connected!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Run migrations: npm run migrate" -ForegroundColor White
        Write-Host "2. Restart server: npm run dev" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  Connection test failed. Please verify:" -ForegroundColor Yellow
        Write-Host "- Password is correct in the URL" -ForegroundColor Gray
        Write-Host "- You copied the POOLER URL (not direct connection)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ That doesn't look like a pooler URL (should contain 'pooler.supabase.com')" -ForegroundColor Red
    Write-Host "Please make sure you're using the Connection Pooling tab, not the direct connection." -ForegroundColor Yellow
}


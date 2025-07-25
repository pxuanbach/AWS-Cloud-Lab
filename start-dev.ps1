# Start Local Development Environment
# This script starts the Docker environment for local development

Write-Host "🚀 Starting Blog App Local Development Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
if (!(Test-Path "data")) { New-Item -ItemType Directory -Path "data" }
if (!(Test-Path "data\mysql")) { New-Item -ItemType Directory -Path "data\mysql" }
if (!(Test-Path "data\minio")) { New-Item -ItemType Directory -Path "data\minio" }

# Copy environment file
if (!(Test-Path ".env")) {
    Write-Host "📄 Creating .env file from .env.docker template..." -ForegroundColor Yellow
    Copy-Item ".env.docker" ".env"
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep 10

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

# Check MySQL
try {
    docker-compose exec -T mysql mysqladmin ping -h "localhost" --silent 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL is ready" -ForegroundColor Green
    } else {
        Write-Host "❌ MySQL is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ MySQL check failed" -ForegroundColor Red
}

# Check MinIO
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ MinIO is ready" -ForegroundColor Green
    } else {
        Write-Host "❌ MinIO is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ MinIO is not responding" -ForegroundColor Red
}

# Check Application
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is ready" -ForegroundColor Green
    } else {
        Write-Host "❌ Application is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Application is not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Available services:" -ForegroundColor Cyan
Write-Host "   • Blog App: http://localhost:8080" -ForegroundColor White
Write-Host "   • MinIO Console: http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor White
Write-Host "   • MySQL: localhost:3306 (root/root123)" -ForegroundColor White
Write-Host ""
Write-Host "👤 Demo accounts:" -ForegroundColor Cyan
Write-Host "   • demo@example.com / Demo123!" -ForegroundColor White
Write-Host "   • admin@example.com / Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Management commands:" -ForegroundColor Cyan
Write-Host "   • Stop: docker-compose down" -ForegroundColor White
Write-Host "   • Logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   • Reset: docker-compose down -v; .\start-dev.ps1" -ForegroundColor White

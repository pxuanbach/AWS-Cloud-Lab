#!/bin/bash

# Start Local Development Environment
# This script starts the Docker environment for local development

echo "🚀 Starting Blog App Local Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/mysql
mkdir -p data/minio

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.docker template..."
    cp .env.docker .env
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check MySQL
if docker-compose exec -T mysql mysqladmin ping -h "localhost" --silent; then
    echo "✅ MySQL is ready"
else
    echo "❌ MySQL is not responding"
fi

# Check MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null; then
    echo "✅ MinIO is ready"
else
    echo "❌ MinIO is not responding"
fi

# Check Application
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ Application is ready"
else
    echo "❌ Application is not responding"
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Available services:"
echo "   • Blog App: http://localhost:8080"
echo "   • MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo "   • MySQL: localhost:3306 (root/root123)"
echo ""
echo "👤 Demo accounts:"
echo "   • demo@example.com / Demo123!"
echo "   • admin@example.com / Admin123!"
echo ""
echo "🛠️  Management commands:"
echo "   • Stop: docker-compose down"
echo "   • Logs: docker-compose logs -f"
echo "   • Reset: docker-compose down -v && ./start-dev.sh"

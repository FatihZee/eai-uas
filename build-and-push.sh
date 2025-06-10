#!/bin/bash

# Docker Hub username
DOCKER_USERNAME="adriandeka18"

# Array semua services termasuk database dan frontend
SERVICES=("database" "frontend" "user-service" "menu-service" "order-service" "review-service" "payment-service")

echo "Logging in to Docker Hub..."
docker login

# Build dan push setiap service
for service in "${SERVICES[@]}"; do
    echo "Building and pushing $service..."
    
    cd $service
    docker build -t $DOCKER_USERNAME/eai-uas-$service:latest .
    docker push $DOCKER_USERNAME/eai-uas-$service:latest
    cd ..
    
    echo "$service pushed successfully!"
done

echo "All services pushed to Docker Hub!"
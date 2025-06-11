# This PowerShell script prepares your Docker image for Azure App Service deployment

# Colors for better output
$green = [ConsoleColor]::Green
$yellow = [ConsoleColor]::Yellow
$cyan = [ConsoleColor]::Cyan

Write-Host "[START] Preparing Docker image for Azure App Service deployment..." -ForegroundColor $green

# Step 1: Use the Azure-specific Nginx configuration
Write-Host "[CONFIG] Copying Azure-specific Nginx configuration..." -ForegroundColor $cyan
Copy-Item .\nginx.conf.azure .\nginx.conf -Force

# Step 2: Build the Docker image
Write-Host "[BUILD] Building Docker image..." -ForegroundColor $cyan
docker-compose -f ../docker-compose.yml build frontend

# Step 3: Tag the image for Azure Container Registry
Write-Host "[TAG] Tagging image for Azure Container Registry..." -ForegroundColor $cyan
docker tag mpp-frontend:latest carshopreg.azurecr.io/frontend:latest

# Step 4: Push the image to Azure Container Registry
Write-Host "[PUSH] Pushing image to Azure Container Registry..." -ForegroundColor $cyan
docker push carshopreg.azurecr.io/frontend:latest

Write-Host "[COMPLETE] Docker image preparation complete!" -ForegroundColor $green
Write-Host "   Image pushed to: carshopreg.azurecr.io/frontend:latest" -ForegroundColor $yellow
Write-Host
Write-Host "[NEXT STEPS]:" -ForegroundColor $cyan
Write-Host "   1. Go to Azure Portal and restart your App Service" -ForegroundColor $yellow
Write-Host "   2. Monitor the deployment logs to ensure it starts correctly" -ForegroundColor $yellow

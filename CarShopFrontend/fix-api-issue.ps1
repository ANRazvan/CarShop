# This PowerShell script fixes the nginx.conf issue and redeploys the Azure app

# Colors for better output
$green = [ConsoleColor]::Green
$yellow = [ConsoleColor]::Yellow
$cyan = [ConsoleColor]::Cyan

Write-Host "[START] Fixing API response issue and redeploying..." -ForegroundColor $green

# Step 1: Create an updated nginx.conf.azure file
Write-Host "[CONFIG] Creating updated nginx configuration..." -ForegroundColor $cyan

# Create the updated nginx configuration
@"
server {
    listen 80 default_server;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files `$uri `$uri/ /index.html;
    }
    
    location /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 'healthy';
    }
    
    # Proxy API requests to backend
    location /api/ {
        # Direct pass to backend - no variables or resolvers
        proxy_pass https://carshop-backend-app.azurewebsites.net/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host carshop-backend-app.azurewebsites.net;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        # No error interception for debugging
    }
    
    # Proxy WebSocket connections
    location /ws {
        # Direct pass to backend - no variables or resolvers
        proxy_pass https://carshop-backend-app.azurewebsites.net/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host carshop-backend-app.azurewebsites.net;
        proxy_cache_bypass `$http_upgrade;
    }
}
"@ | Out-File -FilePath .\nginx.conf.azure.fixed -Encoding utf8

# Step 2: Update the main nginx.conf file
Write-Host "[UPDATE] Updating nginx configuration..." -ForegroundColor $cyan
Copy-Item .\nginx.conf.azure.fixed .\nginx.conf -Force

# Step 3: Build the Docker image
Write-Host "[BUILD] Building Docker image..." -ForegroundColor $cyan
docker-compose -f ../docker-compose.yml build frontend

# Step 4: Tag the image for Azure Container Registry
Write-Host "[TAG] Tagging image for Azure Container Registry..." -ForegroundColor $cyan
docker tag mpp-frontend:latest carshopreg.azurecr.io/frontend:latest

# Step 5: Push the image to Azure Container Registry
Write-Host "[PUSH] Pushing image to Azure Container Registry..." -ForegroundColor $cyan
docker push carshopreg.azurecr.io/frontend:latest

Write-Host "[COMPLETE] Docker image updated and pushed!" -ForegroundColor $green
Write-Host "   Image pushed to: carshopreg.azurecr.io/frontend:latest" -ForegroundColor $yellow
Write-Host
Write-Host "[NEXT STEPS]:" -ForegroundColor $cyan
Write-Host "   1. Go to Azure Portal and restart your App Service" -ForegroundColor $yellow
Write-Host "   2. Monitor the deployment logs to ensure it starts correctly" -ForegroundColor $yellow
Write-Host "   3. Check the application to verify it connects to the backend" -ForegroundColor $yellow

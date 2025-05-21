# Azure Container Apps deployment script (PowerShell)

# Variables
$RESOURCE_GROU# Step 13: Register required Azure resource providers
Write-Host "Registering necessary Azure resource providers..." -ForegroundColor Green
$providers = @(
    "Microsoft.OperationalInsights",
    "Microsoft.App",
    "Microsoft.ContainerRegistry",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.Cache"
)

foreach ($provider in $providers) {
    Write-Host "Registering provider: $provider" -ForegroundColor Cyan
    az provider register --namespace $provider --wait
} "carshop-rg"
$LOCATION = "westeurope"  # Changed from eastus to westeurope
$ACR_NAME = "carshopregistry$(Get-Random -Minimum 100000 -Maximum 999999)"  # Adding randomness to ensure uniqueness
$BACKEND_APP_NAME = "carshop-backend"
$FRONTEND_APP_NAME = "carshop-frontend"
$POSTGRES_SERVER_NAME = "carshop-pg-$(Get-Random -Minimum 100 -Maximum 999)"  # Adding randomness
$POSTGRES_ADMIN_USER = "postgresadmin"
$POSTGRES_ADMIN_PASSWORD = "CarShop@SecureDB2025"  # Replace with your own secure password if needed
$POSTGRES_DB_NAME = "carshop"
$REDIS_NAME = "carshop-redis-$(Get-Random -Minimum 100 -Maximum 999)"  # Adding randomness
$ENVIRONMENT_NAME = "carshop-environment"

# Step 1: Login to Azure
Write-Host "Logging into Azure..." -ForegroundColor Green
az login

# Step 2: Register necessary Azure resource providers
Write-Host "Registering necessary Azure resource providers..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.DBforPostgreSQL --wait
az provider register --namespace Microsoft.Cache --wait
az provider register --namespace Microsoft.OperationalInsights --wait
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Storage --wait
az provider register --namespace Microsoft.Network --wait
Write-Host "Resource providers registered successfully!" -ForegroundColor Green

# Step 3: Create Resource Group
Write-Host "Creating Resource Group..." -ForegroundColor Green
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 4: Create Azure Container Registry
Write-Host "Creating Azure Container Registry..." -ForegroundColor Green
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true --location $LOCATION

# Step 5: Get ACR credentials
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query username --output tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv
$ACR_SERVER = "$ACR_NAME.azurecr.io"

Write-Host "ACR Server: $ACR_SERVER" -ForegroundColor Cyan
Write-Host "ACR Username: $ACR_USERNAME" -ForegroundColor Cyan

# Step 6: Login to ACR
Write-Host "Logging into ACR..." -ForegroundColor Green
az acr login --name $ACR_NAME

# Step 7: Build and push the backend image
Write-Host "Building and pushing backend image..." -ForegroundColor Green
docker build -t "$ACR_SERVER/carshop-backend:latest" ./CarShopBackend
docker push "$ACR_SERVER/carshop-backend:latest"

# Step 8: Build and push the frontend image
Write-Host "Building and pushing frontend image..." -ForegroundColor Green
docker build -t "$ACR_SERVER/carshop-frontend:latest" ./CarShopFrontend --build-arg "VITE_API_URL=/api"
docker push "$ACR_SERVER/carshop-frontend:latest"

# Step 9: Create Azure Database for PostgreSQL Flexible Server (newer recommendation)
Write-Host "Creating PostgreSQL Flexible server..." -ForegroundColor Green
az postgres flexible-server create --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME `
    --location $LOCATION --admin-user $POSTGRES_ADMIN_USER --admin-password $POSTGRES_ADMIN_PASSWORD `
    --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 14

# Step 10: Configure PostgreSQL Firewall - allow Azure services
Write-Host "Configuring PostgreSQL firewall..." -ForegroundColor Green
az postgres flexible-server firewall-rule create --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME `
    --rule-name AllowAzureServices --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

# Step 11: Create PostgreSQL Database
Write-Host "Creating PostgreSQL database..." -ForegroundColor Green
az postgres flexible-server db create --resource-group $RESOURCE_GROUP --server-name $POSTGRES_SERVER_NAME --database-name $POSTGRES_DB_NAME

# Step 12: Create Azure Redis Cache
Write-Host "Creating Azure Redis Cache..." -ForegroundColor Green
az redis create --resource-group $RESOURCE_GROUP --name $REDIS_NAME --location $LOCATION --sku Basic --vm-size C0

# Step 13: Get Redis connection string
$REDIS_CONNECTION_STRING = az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query primaryKey --output tsv

# Step 14: Register Microsoft.OperationalInsights provider (required for Container Apps)
Write-Host "Registering OperationalInsights provider..." -ForegroundColor Green
az provider register --namespace Microsoft.OperationalInsights --wait

# Step 15: Create Container Apps environment
Write-Host "Creating Container Apps environment..." -ForegroundColor Green
az containerapp env create --resource-group $RESOURCE_GROUP --name $ENVIRONMENT_NAME --location $LOCATION

# Step 16: Deploy Backend Container App
Write-Host "Deploying Backend Container App..." -ForegroundColor Green
az containerapp create `
    --resource-group $RESOURCE_GROUP `
    --name $BACKEND_APP_NAME `
    --environment $ENVIRONMENT_NAME `
    --image "$ACR_SERVER/carshop-backend:latest" `
    --registry-server "$ACR_SERVER" `
    --registry-username "$ACR_USERNAME" `
    --registry-password "$ACR_PASSWORD" `
    --target-port 3000 `
    --ingress external `
    --env-vars "PG_HOST=$POSTGRES_SERVER_NAME.postgres.database.azure.com" "PG_DATABASE=$POSTGRES_DB_NAME" "PG_USER=$POSTGRES_ADMIN_USER" "PG_PASSWORD=$POSTGRES_ADMIN_PASSWORD" "JWT_SECRET=production_jwt_secret_key" "REDIS_URL=redis://default:$REDIS_CONNECTION_STRING@$REDIS_NAME.redis.cache.windows.net:6380?ssl=true" "NODE_ENV=production"

# Step 17: Deploy Frontend Container App
Write-Host "Deploying Frontend Container App..." -ForegroundColor Green
az containerapp create `
    --resource-group $RESOURCE_GROUP `
    --name $FRONTEND_APP_NAME `
    --environment $ENVIRONMENT_NAME `
    --image "$ACR_SERVER/carshop-frontend:latest" `
    --registry-server "$ACR_SERVER" `
    --registry-username "$ACR_USERNAME" `
    --registry-password "$ACR_PASSWORD" `
    --target-port 80 `
    --ingress external

# Step 18: Get the URLs
$BACKEND_URL = az containerapp show --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME --query properties.configuration.ingress.fqdn -o tsv
$FRONTEND_URL = az containerapp show --resource-group $RESOURCE_GROUP --name $FRONTEND_APP_NAME --query properties.configuration.ingress.fqdn -o tsv

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Backend URL: https://$BACKEND_URL" -ForegroundColor Cyan
Write-Host "Frontend URL: https://$FRONTEND_URL" -ForegroundColor Cyan
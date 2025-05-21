# Azure Container Apps deployment script

# Variables
RESOURCE_GROUP="carshop-rg"
LOCATION="eastus"
ACR_NAME="carshopregistry"
BACKEND_APP_NAME="carshop-backend"
FRONTEND_APP_NAME="carshop-frontend"
POSTGRES_SERVER_NAME="carshop-postgres"
POSTGRES_ADMIN_USER="postgresadmin"
POSTGRES_ADMIN_PASSWORD="YourStrongPassword123!"  # Replace with your secure password
POSTGRES_DB_NAME="carshop"
REDIS_NAME="carshop-redis"
ENVIRONMENT_NAME="carshop-environment"

# Step 1: Login to Azure
echo "Logging into Azure..."
az login

# Step 2: Create Resource Group
echo "Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 3: Create Azure Container Registry
echo "Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Step 4: Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)
ACR_SERVER="$ACR_NAME.azurecr.io"

# Step 5: Login to ACR
echo "Logging into ACR..."
az acr login --name $ACR_NAME

# Step 6: Build and push the backend image
echo "Building and pushing backend image..."
docker build -t $ACR_SERVER/carshop-backend:latest ./CarShopBackend
docker push $ACR_SERVER/carshop-backend:latest

# Step 7: Build and push the frontend image
echo "Building and pushing frontend image..."
docker build -t $ACR_SERVER/carshop-frontend:latest ./CarShopFrontend --build-arg VITE_API_URL="https://$BACKEND_APP_NAME.azurewebsites.net"
docker push $ACR_SERVER/carshop-frontend:latest

# Step 8: Create Azure Database for PostgreSQL
echo "Creating PostgreSQL server..."
az postgres server create --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER_NAME \
    --location $LOCATION --admin-user $POSTGRES_ADMIN_USER --admin-password $POSTGRES_ADMIN_PASSWORD \
    --sku-name GP_Gen5_2 --version 13

# Step 9: Configure PostgreSQL Firewall
echo "Configuring PostgreSQL firewall..."
az postgres server firewall-rule create --resource-group $RESOURCE_GROUP --server $POSTGRES_SERVER_NAME \
    --name AllowAll --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255

# Step 10: Create PostgreSQL Database
echo "Creating PostgreSQL database..."
az postgres db create --resource-group $RESOURCE_GROUP --server-name $POSTGRES_SERVER_NAME --name $POSTGRES_DB_NAME

# Step 11: Create Azure Redis Cache
echo "Creating Azure Redis Cache..."
az redis create --resource-group $RESOURCE_GROUP --name $REDIS_NAME --location $LOCATION --sku Basic --vm-size C0

# Step 12: Get Redis connection string
REDIS_CONNECTION_STRING=$(az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query primaryKey --output tsv)

# Step 13: Register required Azure resource providers
echo "Registering necessary Azure resource providers..."
providers=("Microsoft.OperationalInsights" "Microsoft.App" "Microsoft.ContainerRegistry" "Microsoft.DBforPostgreSQL" "Microsoft.Cache")

for provider in "${providers[@]}"; do
    echo "Registering provider: $provider"
    az provider register --namespace $provider --wait
done

# Step 14: Create Container Apps environment
echo "Creating Container Apps environment..."
az containerapp env create --resource-group $RESOURCE_GROUP --name $ENVIRONMENT_NAME --location $LOCATION

# Step 15: Deploy Backend Container App
echo "Deploying Backend Container App..."
az containerapp create --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME \
    --environment $ENVIRONMENT_NAME \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --image $ACR_SERVER/carshop-backend:latest \
    --target-port 3000 \
    --ingress external \
    --env-vars PG_HOST="$POSTGRES_SERVER_NAME.postgres.database.azure.com" \
               PG_DATABASE="$POSTGRES_DB_NAME" \
               PG_USER="$POSTGRES_ADMIN_USER@$POSTGRES_SERVER_NAME" \
               PG_PASSWORD="$POSTGRES_ADMIN_PASSWORD" \
               REDIS_URL="redis://default:$REDIS_CONNECTION_STRING@$REDIS_NAME.redis.cache.windows.net:6380?ssl=true" \
               JWT_SECRET="production_jwt_secret_key"

# Step 16: Deploy Frontend Container App
echo "Deploying Frontend Container App..."
az containerapp create --resource-group $RESOURCE_GROUP --name $FRONTEND_APP_NAME \
    --environment $ENVIRONMENT_NAME \
    --registry-server $ACR_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --image $ACR_SERVER/carshop-frontend:latest \
    --target-port 80 \
    --ingress external

# Step 17: Get the URLs
BACKEND_URL=$(az containerapp show --resource-group $RESOURCE_GROUP --name $BACKEND_APP_NAME --query properties.configuration.ingress.fqdn -o tsv)
FRONTEND_URL=$(az containerapp show --resource-group $RESOURCE_GROUP --name $FRONTEND_APP_NAME --query properties.configuration.ingress.fqdn -o tsv)

echo "Deployment complete!"
echo "Backend URL: https://$BACKEND_URL"
echo "Frontend URL: https://$FRONTEND_URL"

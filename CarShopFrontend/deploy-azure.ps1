# Login to Azure and set subscription
az login

# Login to Azure Container Registry
az acr login --name carshopreg

# Build and tag the frontend image
docker build -f Dockerfile.azure -t carshopreg.azurecr.io/carshop-frontend:latest .

# Push the image to Azure Container Registry
docker push carshopreg.azurecr.io/carshop-frontend:latest

# Create a web app if it doesn't exist
az webapp create \
    --resource-group myAppGroup \
    --plan myAppServicePlan \
    --name carshop-frontend \
    --deployment-container-image-name carshopreg.azurecr.io/carshop-frontend:latest

# Configure the web app
az webapp config container set \
    --resource-group myAppGroup \
    --name carshop-frontend \
    --docker-custom-image-name carshopreg.azurecr.io/carshop-frontend:latest \
    --docker-registry-server-url https://carshopreg.azurecr.io \
    --multicontainer-config-type compose

# Enable logging
az webapp log config \
    --resource-group myAppGroup \
    --name carshop-frontend \
    --docker-container-logging filesystem

# Configure environment variables
az webapp config appsettings set \
    --resource-group myAppGroup \
    --name carshop-frontend \
    --settings \
    WEBSITES_PORT=80 \
    NODE_ENV=production

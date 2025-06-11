# CarShop Application Deployment Guide

This guide outlines how to deploy the CarShop application using Docker and Azure Container Apps.

## Local Deployment with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine
- Git repository cloned to your local machine

### Steps for Local Deployment

1. Navigate to the root directory of the project:

```bash
cd path/to/CarShop
```

2. Start the application using Docker Compose:

```bash
docker-compose up -d
```

This will start the following services:
- PostgreSQL database
- Redis cache
- Backend API server
- Frontend web application

3. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000

4. To stop the application:

```bash
docker-compose down
```

## Azure Deployment

### Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Azure subscription
- Docker installed on your machine

### Steps for Azure Deployment

1. Navigate to the root directory of the project:

```bash
cd path/to/CarShop
```

2. Make sure you've registered all the required resource providers in your Azure subscription:

```powershell
# PowerShell
$providers = @(
    "Microsoft.OperationalInsights",
    "Microsoft.App",
    "Microsoft.ContainerRegistry",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.Cache",
    "Microsoft.Web",
    "Microsoft.Storage",
    "Microsoft.Network"
)

foreach ($provider in $providers) {
    Write-Host "Registering provider: $provider"
    az provider register --namespace $provider --wait
}
```

```bash
# Bash
providers=("Microsoft.OperationalInsights" "Microsoft.App" "Microsoft.ContainerRegistry" "Microsoft.DBforPostgreSQL" "Microsoft.Cache" "Microsoft.Web" "Microsoft.Storage" "Microsoft.Network")

for provider in "${providers[@]}"; do
    echo "Registering provider: $provider"
    az provider register --namespace $provider --wait
done
```

3. Make the deployment script executable (for Bash):

```bash
chmod +x azure-deploy.sh
```

4. Run the deployment script (choose one based on your environment):

```bash
# Bash
./azure-deploy.sh

# PowerShell
./azure-deploy.ps1
```

The script will:
- Create necessary Azure resources (Resource Group, Container Registry, PostgreSQL, Redis)
- Build and push Docker images to Azure Container Registry
- Deploy the application to Azure Container Apps
- Output the URLs for accessing your deployed application

4. Access your application using the URLs provided at the end of the deployment.

### Important Notes

- The deployment script creates Azure resources that might incur costs. Make sure to review Azure pricing.
- For production deployments, consider using Azure KeyVault for storing secrets instead of environment variables.
- Set strong passwords for your database and Redis in the deployment script.

## Troubleshooting

- If you encounter any issues with the backend not connecting to PostgreSQL, check the connection string and firewall rules.
- For issues with frontend not connecting to backend, verify the VITE_API_URL environment variable is correctly set.
- Check application logs in Azure Container Apps for more detailed error information.
- If deployment fails with errors about missing resource providers, make sure to register all required providers as mentioned in step 2 of Azure Deployment.
- For "SkuNotAvailable" errors, try a different Azure region as resource availability can vary by location.
- If you see "NameNotAvailable" errors, modify the randomization in the resource names by changing the random suffix in the deployment scripts.

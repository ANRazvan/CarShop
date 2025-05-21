# This PowerShell script will build and test the new Docker configuration

Write-Host "Building Docker image with new configuration..." -ForegroundColor Green
Copy-Item .\nginx.conf.new .\nginx.conf -Force
Copy-Item .\Dockerfile.new .\Dockerfile -Force

# Build the Docker image
docker build -t carshop-frontend-test:latest .

# Run the container
Write-Host "Running container with new configuration..." -ForegroundColor Green
docker run -d --name carshop-frontend-test -p 8080:80 carshop-frontend-test:latest

# Wait for container to initialize
Start-Sleep -Seconds 3

# Check if the container is running
$containerStatus = docker ps -f "name=carshop-frontend-test" --format "{{.Status}}"
if ($containerStatus -match "Up") {
    Write-Host "Container is running: $containerStatus" -ForegroundColor Green
    
    # Try to access the health endpoint
    Write-Host "Testing health endpoint..." -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5
        Write-Host "Health endpoint response: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    } catch {
        Write-Host "Failed to access health endpoint: $_" -ForegroundColor Red
    }
    
    # Check container logs
    Write-Host "Container logs:" -ForegroundColor Yellow
    docker logs carshop-frontend-test
} else {
    Write-Host "Container failed to start properly" -ForegroundColor Red
    Write-Host "Container logs:" -ForegroundColor Yellow
    docker logs carshop-frontend-test
}

# Cleanup prompt
Write-Host "`nWhen you're done testing, run this command to clean up:" -ForegroundColor Cyan
Write-Host "docker rm -f carshop-frontend-test" -ForegroundColor Cyan

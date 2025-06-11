#!/bin/bash
# This script will run a health check on the container

echo "=== CONTAINER HEALTH CHECK ==="
echo "Date: $(date)"
echo

echo "=== PROCESSES ==="
ps aux
echo

echo "=== NGINX CONFIG ==="
echo "Configuration test:"
nginx -t
echo

echo "=== NETWORKING ==="
echo "Network interfaces:"
ip addr
echo
echo "DNS resolution:"
cat /etc/resolv.conf
echo

echo "=== NGINX DEFAULT CONF ==="
cat /etc/nginx/conf.d/default.conf
echo

echo "=== CHECKING CONNECTIVITY ==="
echo "Testing local server:"
curl -v http://localhost:80 || echo "Failed to connect to localhost"
echo
echo "Testing backend connection:"
curl -v http://backend:3000/api/cars?page=1&itemsPerPage=1 || echo "Failed to connect to backend"
echo

echo "=== FILE SYSTEM ==="
echo "Check HTML directory:"
ls -la /usr/share/nginx/html
echo

echo "=== LOGS ==="
echo "Nginx error log:"
cat /var/log/nginx/error.log
echo "Nginx access log:"
cat /var/log/nginx/access.log
echo

echo "=== ENVIRONMENT ==="
env
echo

echo "=== END OF HEALTH CHECK ==="

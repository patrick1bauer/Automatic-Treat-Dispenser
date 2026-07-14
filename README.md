# Automatic-Treat-Dispenser

1. Edit file & save

2. Update raspberry pi shit
sudo apt update
sudo apt upgrade

3. Shut down treat dispener:
sudo docker compose -f docker-compose.yml down

4. Remove images
sudo docker image rm treat-backend
sudo docker image rm treat-frontend

5. Compile & Bring up treat dispenser
sudo docker compose -f docker-compose.yml up -d
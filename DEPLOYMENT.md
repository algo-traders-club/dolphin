# Deploying to AWS Lightsail Containers

This guide provides step-by-step instructions for deploying the Orca Liquidity Agent to AWS Lightsail Containers.

## Prerequisites

Before you begin, make sure you have:

1. An AWS account with access to Lightsail
2. AWS CLI installed and configured
3. Docker installed on your local machine
4. A Solana wallet with SOL and USDC
5. A Solana RPC endpoint with sufficient rate limits (e.g., Helius)

## Step 1: Prepare Your Application

### Create a Production-Ready Docker Image

1. Update your `.env` file with production values:

```bash
# Make a copy of the example env file
cp .env.example .env.production

# Edit the production env file with your values
nano .env.production
```

2. Build a production-ready Docker image:

```bash
docker build -t orca-liquidity-agent:production \
  --build-arg ENV_FILE=.env.production \
  -f Dockerfile .
```

3. Test your Docker image locally:

```bash
docker run -p 3000:3000 orca-liquidity-agent:production
```

## Step 2: Set Up AWS Lightsail Container Service

1. Log in to the AWS Management Console and navigate to Lightsail.

2. Click on "Container services" in the left navigation panel.

3. Click "Create container service".

4. Choose your preferred AWS Region.

5. Select a container service capacity plan based on your needs:
   - Micro: Good for testing (2 vCPU, 512MB RAM)
   - Small: Recommended for production (2 vCPU, 1GB RAM)
   - Medium: For higher performance (2 vCPU, 2GB RAM)
   - Large: For intensive workloads (2 vCPU, 4GB RAM)

6. Name your service (e.g., `orca-liquidity-agent`).

7. Click "Create container service".

## Step 3: Configure Your Container

Once your container service is created, you'll need to configure your container deployment:

1. Click on "Deployments" tab.

2. Click "Create your first deployment".

3. Choose "Specify a custom deployment" option.

4. Configure your container:
   - Container name: `app`
   - Image: `<your-image-url>` (We'll push to Lightsail in the next step)
   - Port: `3000`
   - Environment variables:
     - Add all your environment variables from `.env.production` here
     - Make sure to include `SOLANA_RPC_URL`, `WALLET_PRIVATE_KEY`, etc.
     - For security, consider using AWS Secrets Manager for sensitive values

5. Click "Add container entry" if you need to add a TimescaleDB container:
   - Container name: `timescaledb`
   - Image: `timescale/timescaledb:latest-pg14`
   - Port: `5432`
   - Environment variables:
     - `POSTGRES_USER`: `postgres`
     - `POSTGRES_PASSWORD`: `<your-secure-password>`
     - `POSTGRES_DB`: `dolphin`

6. Configure public endpoints:
   - For the `app` container, set the port to `3000`

7. Save your deployment configuration but don't deploy yet.

## Step 4: Push Your Docker Image to Lightsail

1. Get the push commands from Lightsail:
   - In your container service, click on "Images"
   - Click "Push container image"
   - Follow the instructions to push your local image to Lightsail

2. The commands will look something like this:

```bash
# Install the Lightsail plugin for the AWS CLI
aws lightsail install-default-key-pair

# Get the push command
aws lightsail get-container-service-deployments --service-name orca-liquidity-agent

# Push your image to Lightsail
aws lightsail push-container-image --service-name orca-liquidity-agent --label app --image orca-liquidity-agent:production
```

3. Note the image name that is returned after pushing (e.g., `:orca-liquidity-agent.app.X`).

## Step 5: Deploy Your Container

1. Go back to the "Deployments" tab in your Lightsail container service.

2. Update your deployment configuration with the new image name.

3. Click "Deploy" to launch your container.

4. Wait for the deployment to complete (this may take a few minutes).

## Step 6: Configure Persistent Storage

For production deployments, you'll want to ensure your database data is persistent:

1. In your container service, click on the "Storage" tab.

2. Click "Create storage".

3. Configure your storage:
   - Name: `timescaledb-data`
   - Mount path: `/var/lib/postgresql/data`
   - Size: At least 10 GB (adjust based on your needs)

4. Click "Create storage".

5. Update your deployment to use this storage for the TimescaleDB container.

## Step 7: Set Up Custom Domain (Optional)

1. In your container service, click on the "Custom domains" tab.

2. Click "Create certificate".

3. Enter your domain name (e.g., `liquidity-agent.yourdomain.com`).

4. Follow the instructions to validate your domain.

5. Once validated, enable custom domains and configure your DNS settings.

## Step 8: Monitor Your Deployment

1. In your container service, click on the "Metrics" tab to monitor resource usage.

2. Click on "Logs" to view container logs.

3. Set up CloudWatch Alarms for proactive monitoring (optional).

## Step 9: Set Up Auto-Rebalancing

1. Connect to your container service using SSH:

```bash
aws lightsail open-instance-public-ports --port-info fromPort=22,toPort=22,protocol=TCP --instance-name orca-liquidity-agent
aws lightsail get-instance-access-details --instance-name orca-liquidity-agent
```

2. Enable auto-rebalancing:

```bash
# Connect to your container
docker exec -it <container-id> /bin/bash

# Enable auto-rebalancing
bun run src/main.ts rebalance enable
```

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check the container logs in the Lightsail console
   - Verify that all required environment variables are set
   - Ensure your Solana RPC endpoint is accessible

2. **Database connection issues**:
   - Verify that the TimescaleDB container is running
   - Check that the `DATABASE_URL` environment variable is correct
   - Ensure the database password is set correctly

3. **Solana connection issues**:
   - Verify that your RPC endpoint is valid and has sufficient rate limits
   - Check that your wallet has enough SOL for transactions

### Scaling Considerations

1. **CPU and Memory**:
   - Monitor your container's resource usage
   - Upgrade to a larger plan if you consistently use more than 70% of resources

2. **Database Performance**:
   - Consider using a separate RDS instance for production-grade database needs
   - Implement regular database backups

3. **High Availability**:
   - For critical applications, consider deploying to multiple regions
   - Implement a load balancer for high availability

## Security Best Practices

1. **Protect Sensitive Data**:
   - Never store your wallet private key directly in environment variables
   - Use AWS Secrets Manager for sensitive information
   - Regularly rotate credentials

2. **Network Security**:
   - Restrict public access to only necessary ports
   - Use AWS Security Groups to control traffic

3. **Regular Updates**:
   - Keep your container images updated with security patches
   - Regularly update dependencies in your application

## Cost Management

1. **Resource Optimization**:
   - Choose the appropriate container size for your needs
   - Scale down during periods of low activity

2. **Storage Costs**:
   - Monitor your storage usage and adjust as needed
   - Clean up unused images and snapshots

3. **Bandwidth Usage**:
   - Be aware of data transfer costs, especially for high-traffic applications

## Backup and Recovery

1. **Database Backups**:
   - Set up regular database backups
   - Test restoration procedures periodically

2. **Container Snapshots**:
   - Create snapshots of your container service for quick recovery
   - Document the recovery process

By following these steps, you'll have a production-ready Orca Liquidity Agent running on AWS Lightsail Containers with persistent storage, auto-rebalancing capabilities, and proper monitoring.

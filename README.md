# 🚀 Hello-Health — DevOps on AWS with App Runner

This project is a **minimal web service** deployed on **AWS App Runner** using a **CI/CD pipeline in GitHub Actions**.  
It demonstrates modern DevOps practices: containerization, automated builds, deployments, and health monitoring.  


# 📌 Requirements Implemented
- ✅ Small service with endpoint GET /health → returns JSON: {"status":"ok","version":"<git_sha>"} 
- ✅ Dockerfile to containerize the service. 
- ✅ GitHub Actions workflow that:
     - Builds & tests
     - Pushes Docker image to Amazon ECR
     - Updates App Runner service to new image
     - Performs a smoke test (/health) 
- ✅ README documenting setup and usage. 


## 🛠️ Tech Stack 
- **Node.js + Express.js** → Minimal API service.  
- **Docker** → Containerization.  
- **Amazon ECR** → Container registry.  
- **AWS App Runner** → Managed deployment service.  
- **GitHub Actions** → CI/CD automation.  
- **Jest + Supertest** → Endpoint testing.  
- **Amazon Linux(locally)** → Used to create a sample image and push it to ECR.




## Git & GitHub Workflow

Follow these steps to create a GitHub repository, push your code, and trigger CI/CD deployments:

- Go to GitHub and log in.
- Click New Repository.
- Enter a repository name (e.g., hello-health-app).
- Choose Public or Private.
- Click Create Repository

### Initialize Git ###
git init
### Add all project files (including Dockerfile, server.js/app.js, workflow yml) ###
git add .
### Commit your changes ###
- git commit -m "Initial commit: add app, Dockerfile, workflow"
- git branch -M main
- git remote add origin https://github.com/username/repo.git
- git push -u origin main 

- This triggers the GitHub Actions workflow if .github/workflows/ci-cd-apprunner.yml exists.
- GitHub Actions will run tests, build Docker image, push to ECR, deploy to App Runner, and perform a smoke test.






## ⚙️ Setup / Installation
Create HELLO-HEALTH directory and switch to that directory

1. **Initialize Node.js project**  
npm init -y
(This creates a default package.json file for the project.)

2. Install dependencies
(Install Express for building the web service:)
npm install express

3. Install development dependencies
(Install Jest and Supertest for testing the /health endpoint:)
npm install --save-dev jest supertest



## 📂 Project Structure
HELLO-HEALTH 
  - app.js  #Express application with /health endpoint
  - index.js  #Entry point to start the server
  - Dockerfile  #Container build instructions
  - .github/workflows/ci-cd-apprunner.yml   #CI/CD pipeline
  - test/health.test.js   #Jest test for /health endpoint
  - README.md # Documentation
  



# 🐳 Dockerfile Overview
###This Dockerfile containerizes the Hello-Health Node.js application so it can run consistently on any environment or cloud platform like AWS App Runner.###

### Explanation of Dockerfile: ###
```FROM node:18-alpine ```
  ***Uses a lightweight Node.js 18 image based on Alpine Linux as the base image.***

- WORKDIR /app
  ***Sets /app as the working directory inside the container. All subsequent commands run in this folder.***

- COPY package*.json ./
  ***Copies package.json and package-lock.json into the container to install dependencies first (helps with Docker caching).***

- RUN npm ci --only=production
    ***Installs only production dependencies listed in package.json. npm ci ensures a clean and consistent install using the lock file.***

- COPY . .
    ***Copies the rest of the application code into the container.***

- ARG GIT_SHA=dev and ENV GIT_SHA=$GIT_SHA
    ***Sets a build-time argument GIT_SHA (default: dev) and makes it available as an environment variable inside the container.This is used in /health to display the current Git commit SHA.***

- EXPOSE 8080
    ***Declares that the app listens on port 8080. App Runner or any container orchestrator uses this port to route traffic.***

- CMD ["node", "index.js"]
    ***Default command to start the Node.js application when the container runs.***






# CI/CD Workflow — GitHub Actions Overview :
### This workflow automates the build, test, deployment, and verification of the Hello-Health service to AWS App Runner whenever code is pushed to the main branch. ###

```name: CI/CD — App Runner
on:
  push:
    branches: [ main ]```
    
         (Job Name: deploy
          Runner: ubuntu-latest
          Environment Variables:
          ECR_URI → Amazon ECR repository URI
          AWS_REGION → AWS region
          COMMIT_SHA → Current Git commit SHA)

- name: Checkout
  uses: actions/checkout@v4
          (Pulls the latest code from GitHub to the runner.)

- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 18
           (Configures Node.js 18 for building and testing the application.)

- name: Install & test
  run: |
    npm ci
    npm test
            (Installs project dependencies using npm ci.
             Runs tests using Jest + Supertest to ensure /health endpoint works correctly.)

- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}
             (Authenticates the GitHub runner with AWS to allow deployment.)

- name: Login to Amazon ECR
  uses: aws-actions/amazon-ecr-login@v1
              (Logs into the private ECR repository to allow Docker image pushes.)

- name: Build & push image to ECR
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: |
      ${{ env.ECR_URI }}:latest
      ${{ env.ECR_URI }}:${{ env.COMMIT_SHA }}
    build-args: |
      GIT_SHA=${{ env.COMMIT_SHA }}
                (Builds the Docker image for the service.
                 Tags the image with latest and the current commit SHA for versioning.
                 Pushes the image to Amazon ECR.
                 Passes the commit SHA as a build argument to embed in the app for /health endpoint.)

- name: Wait for App Runner service to be RUNNING
  run: |
    for i in $(seq 1 30); do
      STATUS=$(aws apprunner describe-service \
        --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }} \
        --query 'Service.Status' --output text \
        --region ${{ env.AWS_REGION }})
      echo "Service status: $STATUS"
      if [ "$STATUS" = "RUNNING" ]; then
        echo "Service is running!"
        break
      fi
      sleep 5
    done
                  (Waits until the App Runner service is in the RUNNING state before starting a new deployment.)

- name: Start App Runner deployment
  run: |
    aws apprunner start-deployment \
      --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }} \
      --region ${{ env.AWS_REGION }}
                   (Triggers App Runner to deploy the new Docker image pushed to ECR.)
  

- name: Smoke test /health (wait & check)
  run: |
    sudo apt-get update && sudo apt-get install -y jq
    # get service URL
    for i in $(seq 1 20); do
      SERVICE_URL=$(aws apprunner describe-service \
        --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }} \
        --query 'Service.ServiceUrl' --output text --region ${{ env.AWS_REGION }})
      if [ -n "$SERVICE_URL" ]; then
        echo "Service URL: $SERVICE_URL"
        break
      fi
      echo "Waiting for service URL... ($i/20)"
      sleep 3
    done
    # poll /health endpoint until status is ok and version matches commit SHA
    for i in $(seq 1 30); do
      HTTP_CODE=$(curl -s -o /tmp/health.json -w "%{http_code}" "https://${SERVICE_URL}/health" || echo "000")
      if [ "$HTTP_CODE" = "200" ]; then
        STATUS=$(jq -r '.status' /tmp/health.json)
        VERSION=$(jq -r '.version' /tmp/health.json)
        if [ "$STATUS" = "ok" ] && [[ "$VERSION" == "${{ env.COMMIT_SHA }}"* ]]; then
          echo "Smoke test passed (status ok, version = $VERSION)"
          exit 0
        fi
        echo "Health returned HTTP 200 but payload doesn't match. status=$STATUS version=$VERSION"
      fi
      sleep 5
    done
    echo "Smoke test failed" >&2
    exit 1
                  (Polls the App Runner service URL until it’s available.
                   Calls /health endpoint to verify the deployment.
                   Checks that the status is "ok" and the version matches the current commit SHA.
                   Ensures the pipeline fails if the smoke test does not pass.)
  

Summary:
1. This workflow guarantees that every push to main triggers a fully automated CI/CD pipeline:
2. Code tested locally.
3. Docker image built & versioned.
4. Image pushed to ECR.
5. App Runner service updated automatically.
6. Health endpoint validated to confirm deployment success.







## Step-by-Step AWS Setup:

step 1: Create a private ECR repository:
        Go to AWS ECR → Create repository → Copy the repository URI.
        Push a sample/dummy image to ECR (8080 port allowed)

step 2: Create an App Runner service:
        Repository type: Container registry
        Provider: Amazon ECR
        Container image URI: Use your sample ECR image
        Deployment trigger: Automatic
        Port: 8080
        IAM Role: AppRunnerECRAccessRole (so App Runner can pull from ECR)
        Create the service → Copy the Service ARN

step 3: Create GitHub Secrets:
        Go to GitHub Repo → Settings → Secrets → Actions → New repository secret
        Add:
        AWS_ACCESS_KEY_ID → Your AWS access key
        AWS_SECRET_ACCESS_KEY → Your AWS secret key
        AWS_REGION → e.g., ap-south-1
        ECR_URI → Your ECR repository URI
        APP_RUNNER_SERVICE_ARN → App Runner service ARN

step 4: Push code to GitHub repository:
        Workflow triggers automatically on main branch push.
        Docker image is built and deployed to App Runner.
        Visit App Runner URL → /health returns JSON:
         {
           "status": "ok",
           "version": "<git_sha>"
         }


         
Each new commit updates version with the latest Git SHA.
Accessing the App
App Runner Service URL: https://<your-app-runner-service-url>/health
Example Response:
{
  "status": "ok",
  "version": "41ef1ca1ec985b9b689a0c8cd7764538a94ccc82"
}

## 📝 Trigger Deployment & Check Git SHA

Every time you push changes to the main branch, the GitHub Actions CI/CD workflow automatically:
Builds and tests your code.
Builds a Docker image with the current Git commit SHA.
Pushes the image to Amazon ECR.
Deploys it to AWS App Runner.
Performs a smoke test on /health to confirm deployment.

## Steps to Trigger a Deployment:
Make a change in your Express code (e.g., add a new message or endpoint).
Stage and commit your changes:
git add .
git commit -m "Your commit message"
git push origin main

Open the App Runner service URL in your browser:
https://<your-app-runner-service-url>/health

You will see a JSON response like:
{
  "status": "ok",
  "version": "0f1b2988ac5903ee686b09adbb12f24f4937da1"
}

The version field corresponds to the Git commit SHA for the pushed changes.
Every push or commit to main automatically updates this version.



# Microservices Architecture

This project demonstrates a microservices-based architecture for a blogging application, converted from a monolithic application. The system is composed of the following microservices:

## Services

### 1. Auth Service (Port 3001)
- Handles user authentication and authorization
- Manages user registration and login
- Provides token verification for other services
- Has its own dedicated MongoDB database (auth-db)

### 2. Blog Service (Port 3002)
- Manages blog posts
- Handles CRUD operations for blogs
- Communicates with Auth Service for user verification
- Has its own dedicated MongoDB database (blog-db)

### 3. Comment Service (Port 3003)
- Manages comments for blog posts
- Handles CRUD operations for comments
- Communicates with Auth Service for user verification
- Communicates with Blog Service to verify blog existence
- Has its own dedicated MongoDB database (comment-db)

### 4. Profile Service (Port 3004)
- Manages user profiles
- Handles profile creation, updates, and deletion
- Communicates with Auth Service for user verification
- Has its own dedicated MongoDB database (profile-db)

### 5. API Gateway (Port 3000)
- Single entry point for all client requests
- Routes requests to appropriate microservices
- Provides unified health check endpoint

## Architecture Diagram

```
                   ┌─────────────┐
                   │ API Gateway │
                   │   (3000)    │
                   └─────┬───────┘
                         │
         ┌───────────────┼───────────────┬────────────────┐
         │               │               │                │
┌────────▼──────┐ ┌──────▼───────┐ ┌─────▼────────┐ ┌─────▼────────┐
│ Auth Service  │ │ Blog Service │ │Comment Service│ │Profile Service│
│    (3001)     │ │    (3002)    │ │    (3003)    │ │    (3004)    │
└────────┬──────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
         │               │                │                │
┌────────▼──────┐ ┌──────▼───────┐ ┌──────▼───────┐ ┌──────▼───────┐
│   Auth DB     │ │   Blog DB    │ │  Comment DB  │ │  Profile DB  │
│  (MongoDB)    │ │  (MongoDB)   │ │  (MongoDB)   │ │  (MongoDB)   │
└───────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Running the Application

### With Docker (Recommended)

The application is fully containerized using Docker and Docker Compose. Each service has its own dedicated MongoDB database container. Services communicate with each other using network-resolvable container names.

To run the entire application:

```bash
cd microservices
docker-compose up
```

This will start:
- 4 MongoDB instances (one for each service)
- 4 Service containers
- 1 API Gateway container

All services are connected through a Docker network that allows them to communicate using container names.

## API Endpoints

All requests should go through the API Gateway at `http://localhost:3000`

### Auth Service
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/verify` - Verify user token

### Blog Service
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get a specific blog
- `POST /api/blogs` - Create a new blog
- `PUT /api/blogs/:id` - Update a blog
- `DELETE /api/blogs/:id` - Delete a blog

### Comment Service
- `GET /api/comments/blog/:blogId` - Get all comments for a blog
- `POST /api/comments` - Add a comment
- `PUT /api/comments/:id` - Update a comment
- `DELETE /api/comments/:id` - Delete a comment

### Profile Service
- `GET /api/profile/:userId` - Get a user's profile
- `POST /api/profile` - Create or update a profile
- `DELETE /api/profile` - Delete a profile

## Health Check
- `GET /api/health` - Check health status of all services

## CI/CD Pipeline

This project includes a CI/CD pipeline using GitHub Actions. The workflow is defined in `.github/workflows/ci-cd.yml`.

### CI Process
For each microservice, the pipeline:
1. Checks out the code
2. Sets up Node.js environment
3. Installs dependencies using `npm ci`
4. Runs service-specific tests with `npm test`
5. Builds a Docker image for the service

### CD Process
When code is pushed to the main/master branch:
1. All Docker images are built
2. Images are tagged with both latest and commit SHA
3. Images are pushed to Docker Hub

### Workflow Triggers
- The pipeline runs on push to main, master, or develop branches
- The pipeline also runs on pull requests to these branches
- The deployment step only runs on push to main or master

### Service-Specific Tests
Each service has its own test directory containing unit and integration tests:
- Auth Service: `microservices/auth-service/tests/`
- Blog Service: `microservices/blog-service/tests/`
- Comment Service: `microservices/comment-service/tests/`
- Profile Service: `microservices/profile-service/tests/`
- API Gateway: `microservices/api-gateway/tests/`

### Running Tests Locally
Each service can be tested independently:

```bash
cd microservices/auth-service
npm test

cd microservices/blog-service
npm test

# And so on for each service
```

## Architecture Benefits

1. **Database Isolation**: Each service has its own database, which prevents a single database from becoming a bottleneck
2. **Scalability**: Each service and its database can be scaled independently based on demand
3. **Fault Isolation**: Issues in one service don't affect others
4. **Technology Diversity**: Different services can use different databases if needed
5. **Independent Deployment**: Services can be deployed independently
6. **Network Resolution**: Services communicate using container names instead of hardcoded IP addresses



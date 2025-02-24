# Task Manager API

## Overview
The **Task Manager API** is a secure and interactive web application built with **Node.js, Express.js, MongoDB Atlas, and EJS**. The system includes **user authentication**, **task management**, and **role-based access control (RBAC)**.

## Features
- **User Authentication**: Register, login, logout using sessions with `express-session` and password hashing with `bcrypt`.
- **Task Management**: Users can create, edit, delete tasks with priority levels and deadlines.
- **RBAC (Role-Based Access Control)**: Admins can manage users and tasks.
- **Security Measures**: Session handling, CSRF protection, JWT authentication, and input validation.
- **Interactive UI**: Dynamic rendering with **EJS**.
- **File Uploads**: Users can upload avatars during registration.
- **Deployment Ready**: Can be hosted on **Heroku**, **Render**, **Railway**, or other platforms.

---

## Setup Instructions
### Prerequisites
Make sure you have the following installed:
- **Node.js** (v16+ recommended)
- **MongoDB Atlas** account and connection string
- **Git**

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/CodeWizardMagic/Task-Manager-
   cd task-manager
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and configure environment variables:
   ```env
    MONGO_URI=mongodb+srv://olzhas:Umarovo1%40@mongodbcluster.ttqjj.mongodb.net/?retryWrites=true&w=majority&appName=mongoDbCluster
    SESSION_SECRET=mySuperSecretKey123
    PORT=3000
    NODE_ENV='production'
   ```
4. Start the application:
   ```sh
   npm start
   ```
   The server will run on `http://localhost:8081`.

---

## API Documentation

### Authentication
#### Register a new user
```http
POST /auth/register
```
**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword",
  "confirmPassword": "securepassword"
}
```

#### Login
```http
POST /auth/login
```
**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "securepassword"
}

```

#### Logout
```http
GET /auth/logout
```
Logs out the user and destroys the session.

---

### Task Management
#### Get all tasks (authenticated users only)
```http
GET /tasks
```

#### Create a new task
```http
POST /tasks
```
**Request Body:**
```json
{
  {
  "_id": {
    "$oid": "67ba4e87ea2067831617b05e"
  },
  "title": "Final Web",
  "description": "Final web project",
  "status": "completed",
  "priority": "high",
  "dueDate": {
    "$date": "2025-02-25T00:00:00.000Z"
  },
  "userId": {
    "$oid": "67ba3ec8207b2b0f3182f36c"
  },
  "createdAt": {
    "$date": "2025-02-22T22:24:07.791Z"
  },
  "updatedAt": {
    "$date": "2025-02-22T22:28:16.346Z"
  },
  "__v": 0
}
}
```

#### Update a task
```http
PUT /tasks/:id
```

#### Delete a task
```http
DELETE /tasks/:id
```

---

## Deployment
### Deploying to Railway
1. Install the Railway CLI and log in:
   ```sh
   npm i -g @railway/cli
   railway login
   ```
2. Create a new project:
   ```sh
   railway init
   ```
3. Add MongoDB Atlas URI to Railway environment variables:
   ```sh
   railway variables set MONGO_URI=mongodb+srv://olzhas:Umarovo1%40@mongodbcluster.ttqjj.mongodb.net/?retryWrites=true&w=majority&appName=mongoDbCluster
   ```
4. Deploy the app:
   ```sh
   railway up
   ```


---




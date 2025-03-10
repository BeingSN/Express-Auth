Project Setup & API Endpoints

Running the Project

To start the development server, use the following command:

npm run dev

API Endpoints

User Signup

Endpoint:

POST http://localhost:5000/api/auth/signup

Request Payload:

{
  "firstName": "Mohammad",
  "lastName": "Shahmeer",
  "email": "testing123@gmail.com",
  "password": "testing@123",
  "role": "user"
}

Description:

Registers a new user with the provided details.

role field determines the user's access level.

User Login

Endpoint:

POST http://localhost:5000/api/auth/login

Request Payload:

{
  "email": "testing123@gmail.com",
  "password": "testing@123"
}

Description:

Authenticates the user with email and password.

Returns an authentication token upon successful login.

Notes

Ensure the backend server is running on port 5000 before making API requests.
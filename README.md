Project Setup & API Endpoints

Running the Project

To start the development server, use the following command:

npm run dev

# API Endpoints

## User Signup

### Endpoint:

POST http://localhost:5000/api/auth/signup

### Request Payload (FormData):

The signup request should be sent as `multipart/form-data`, including a profile image.

#### Example FormData in JavaScript:

```javascript
const formData = new FormData();
formData.append("firstName", "Mohammad");
formData.append("lastName", "Shahmeer");
formData.append("email", "testing123@gmail.com");
formData.append("password", "testing@123");
formData.append("role", "user");
formData.append("profileImage", profileImageFile); // profileImageFile should be a File object

Description:

Registers a new user with the provided details.

role field determines the user access level.


## User Login ##

Endpoint:

POST http://localhost:5000/api/auth/login

Request Payload:

{
  "email": "testing123@gmail.com",
  "password": "testing@123"
}

## Description:

Authenticates the user with email and password.

Returns an authentication token and email generation upon successful login.

Notes

Ensure the backend server is running on port 5000 before making API requests.
```

# Mediatech — Invoice Management Application

A Spring Boot application for managing invoices, with a custom JWT authentication and authorization layer.

## Security
- JWT-based authentication (`JwtFilter`, `JwtUtil`)
- Custom `UserDetailsService` for user authentication
- Centralized security configuration (`SecurityConfig`)

package com.example.invoicemanagement.controller;

import com.example.invoicemanagement.model.Client;
import com.example.invoicemanagement.model.User;
import com.example.invoicemanagement.repository.ClientRepository;
import com.example.invoicemanagement.repository.UserRepository;
import com.example.invoicemanagement.security.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        // Create Client first
        Client client = new Client();
        client.setName(req.getUsername()); // Use username as default name, can be updated later
        client.setEmail(req.getEmail() != null ? req.getEmail() : "");
        client.setAddress(req.getAddress() != null ? req.getAddress() : "");
        client = clientRepository.save(client);

        // Create User and link to Client
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("ROLE_USER");
        user.setClient(client);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

            String token = jwtUtil.generateToken(req.getUsername());
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("username", req.getUsername());

            // Extract role from authorities
            String role = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()))
                    .getAuthorities().stream()
                    .findFirst()
                    .map(item -> item.getAuthority())
                    .orElse("ROLE_USER");
            response.put("role", role);

            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        if (user.getClient() != null) {
            response.put("clientId", user.getClient().getId());
            response.put("client", user.getClient());
        }

        return ResponseEntity.ok(response);
    }
}

@Data
class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String address;
}

@Data
class LoginRequest {
    private String username;
    private String password;
}
//controleur REST de l'authentification et de l'inscription des utilisateurs
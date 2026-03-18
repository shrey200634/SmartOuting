package com.smartouting.identity_service.service;

import com.smartouting.identity_service.entity.UserCredential;
import com.smartouting.identity_service.repository.UserCredentialRepository;
import com.smartouting.identity_service.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired private UserCredentialRepository repository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    public String saveUser(UserCredential credential) {
        credential.setPassword(passwordEncoder.encode(credential.getPassword()));
        repository.save(credential);
        return "User added successfully";
    }

    // Returns raw JWT string — same as before, no breaking change
    public String generateToken(String username, String rawPassword) {
        UserCredential user = repository.findByName(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid Access: Wrong Password");
        }

        // Role is embedded as a claim inside the JWT
        return jwtService.generateToken(username, user.getRole());
    }

    public void validateToken(String token) {
        jwtService.validateToken(token);
    }
}
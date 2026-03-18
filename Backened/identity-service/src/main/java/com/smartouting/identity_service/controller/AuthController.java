package com.smartouting.identity_service.controller;

import com.smartouting.identity_service.dto.AuthRequest;
import com.smartouting.identity_service.entity.UserCredential;
import com.smartouting.identity_service.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private AuthService service;

    @PostMapping("/register")
    public String addNewUser(@RequestBody UserCredential user) {
        return service.saveUser(user);
    }

    // Returns raw JWT string — exactly as before
    @PostMapping("/token")
    public String getToken(@RequestBody AuthRequest authRequest) {
        return service.generateToken(authRequest.getUsername(), authRequest.getPassword());
    }

    @GetMapping("/validate")
    public String validateToken(@RequestParam("token") String token) {
        service.validateToken(token);
        return "Token is valid";
    }
}
package com.smartouting.identity_service.service;

import com.smartouting.identity_service.config.CustomUserDetails;
import com.smartouting.identity_service.entity.UserCredential;
import com.smartouting.identity_service.repository.UserCredentialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserCredentialRepository repository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try to find user by Name (or Email if your repo supports it)
        Optional<UserCredential> credential = repository.findByName(username);

        // Convert the "UserCredential" (DB entity) to "CustomUserDetails" (Security object)
        return credential.map(CustomUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with name: " + username));
    }
}
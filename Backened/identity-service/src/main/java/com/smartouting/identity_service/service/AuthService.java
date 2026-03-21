package com.smartouting.identity_service.service;

import com.smartouting.identity_service.entity.UserCredential;
import com.smartouting.identity_service.repository.UserCredentialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserCredentialRepository repository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private OtpService otpService;

    public String saveUser(UserCredential userCredential){
        if (repository.findByEmail(userCredential.getEmail().toLowerCase().trim()) .isPresent()){
            throw new RuntimeException("An Account with this Email already exists.");
        }
        userCredential.setPassword(passwordEncoder.encode(userCredential.getPassword()));
        userCredential.setEmail(userCredential.getEmail().toLowerCase().trim());
        userCredential.setEmailVerified(false);
        repository.save(userCredential);

        // generate and send otp

        otpService.generateAndSend(userCredential.getEmail());

        return  "User registered. Otp sent to " + userCredential.getEmail();
    }
    public String varifyOtp(String email , String otp){
        String normalisedEmail = email.toLowerCase().trim();

        boolean isValid = otpService.varify(normalisedEmail,otp);
        if (!isValid){
            throw new RuntimeException("Invalid or expired OTP. Please try again.");
        }

        //mark user aas varified

        UserCredential userCredential =repository.findByEmail(normalisedEmail)
                .orElseThrow(()-> new RuntimeException("User not found"));

        userCredential.setEmailVerified(true);
        repository.save(userCredential);

        //cleanup old otps
        otpService.cleanupOtps(normalisedEmail);
        return "Email varified successfully!";
    }
    // resend otp

    public String resendOtp(String email ){
        String normalisedEmail = email.toLowerCase().trim();
        UserCredential userCredential=repository.findByEmail(normalisedEmail)
                .orElseThrow(()-> new RuntimeException("No Account found with this Email. "));

        if (userCredential.isEmailVerified()){
            return "Email is already varified. You can login.";
        }
        otpService.generateAndSend(normalisedEmail);
        return  "OTP resent to" + normalisedEmail;
    }




    public String generateToken(String username, String rawPassword) {
        UserCredential user = repository.findByName(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid Access: Wrong Password");
        }

        // Block unverified users from logging in
        if (!user.isEmailVerified()) {
            throw new RuntimeException("EMAIL_NOT_VERIFIED:" + user.getEmail());
        }

        return jwtService.generateToken(username, user.getRole(), user.getEmail());
    }

    public void validateToken(String token) {
        jwtService.validateToken(token);
    }

}
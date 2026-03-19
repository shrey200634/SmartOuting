package com.smartouting.identity_service.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    public void sendOtp(String toEmail , String otp ){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("SmartOuting - Verify your Email");
        message.setText(
                "Hello!\n\n" +
                        "Your verification code is: " + otp + "\n\n" +
                        "This code is valid for 5 minutes.\n" +
                        "If you didn't request this, please ignore this email.\n\n" +
                        "– SmartOuting Team"
        );

        javaMailSender.send(message);
    }
}

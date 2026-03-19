package com.smartouting.identity_service.service;

import com.smartouting.identity_service.entity.OtpVerification;
import com.smartouting.identity_service.repository.OtpVerificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {
    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private EmailService emailService;

    private static final int OTP_EXPIRY_MINUTES=5;


    ///  generate otp 6 digit
    public void generateAndSend(String email){
        String otp = String.valueOf(100_000 + new Random().nextInt(900_000));

        OtpVerification entity = new OtpVerification();
        entity.setEmail(email.toLowerCase().trim());
        entity.setOtp(otp);
        entity.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpVerificationRepository.save(entity);

        emailService.sendOtp(email,otp);
    }

    // VARIFY THE OTP
    public boolean varify(String email , String otp ){
        Optional<OtpVerification> record =
                otpVerificationRepository.findTopByEmailAndUsedFalseOrderByExpiresAtDesc(
                        email.toLowerCase().trim()
                );
        if (record.isEmpty()) return false;

        OtpVerification entry =record.get();

        if (entry.isExpired()) return false;
        if (!entry.getOtp().equals(otp.trim())) return false;

        // mark as used so it can not be used

        entry.setUsed(true);
        otpVerificationRepository.save(entry);
        return true;


    }

    //cleanup old otps for an email //clean the memory

    @Transactional
    public void cleanupOtps(String email){
        otpVerificationRepository.deleteByEmail(email.toLowerCase().trim());
    }


}

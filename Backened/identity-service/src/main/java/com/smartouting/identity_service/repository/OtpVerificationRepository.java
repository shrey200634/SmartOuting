package com.smartouting.identity_service.repository;

import com.smartouting.identity_service.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification , Long> {
    Optional<OtpVerification> findTopByEmailAndUsedFalseOrderByExpiresAtDesc(String email);
    void deleteByEmail(String emai);

}

package com.smartouting.outing_service.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.Data;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Data
@Setter
public class Outing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentId;
    private String studentName;

    // private String parentEmail;

    @Column(name = "parent_email")
    private String parentEmail;

    private String reason;
    private String destination;

    private LocalDateTime outDate;
    private LocalDateTime returnDate;

    private String status = "PENDING";

    // FIXED: Renamed 'wardernComment' to 'wardenComment'
    private String wardenComment;

    // AI Fields
    private String aiFlag;
    private int urgencyScore;

    @Column(length = 1000)
    private String qrCodeUrl;




}

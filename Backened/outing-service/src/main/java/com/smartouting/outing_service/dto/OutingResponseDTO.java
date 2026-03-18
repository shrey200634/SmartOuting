package com.smartouting.outing_service.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OutingResponseDTO {
    private Long id;

    // Added these missing fields back so the UI knows the details
    private String studentId;
    private String studentName;
    private String reason;
    private String destination;

    private String status;
    private String aiFlag;
    private int urgencyScore;

    private String wardenComment;
    private String qrCodeUrl;

    private LocalDateTime outDate;
    private LocalDateTime returnDate;

}
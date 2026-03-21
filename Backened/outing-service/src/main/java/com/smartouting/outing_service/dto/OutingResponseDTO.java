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

    private String studentId;
    private String studentName;
    private String studentEmail;
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
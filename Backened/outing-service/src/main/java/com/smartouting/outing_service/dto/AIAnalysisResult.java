package com.smartouting.outing_service.dto;

import lombok.Data;
import lombok.Getter;

import java.util.List;
@Getter
@Data
public class AIAnalysisResult {
        private String category;          // e.g., "MEDICAL_EMERGENCY"
        private int urgencyScore;         // 0-100
        private int confidenceLevel;      // 0-100%
        private List<String> riskFlags;   // ["Suspicious Keyword", "Too Short"]
        private String recommendation;    // "APPROVE" or "MANUAL_REVIEW"
        private String explanation;       // "Classified as MEDICAL..."

        // Constructor
        public AIAnalysisResult(String category, int urgencyScore, int confidenceLevel,
                                List<String> riskFlags, String recommendation, String explanation) {
            this.category = category;
            this.urgencyScore = urgencyScore;
            this.confidenceLevel = confidenceLevel;
            this.riskFlags = riskFlags;
            this.recommendation = recommendation;
            this.explanation = explanation;
        }

        // Getters (Required for the Logic to read the data)
        public String getCategory() { return category; }
        public int getUrgencyScore() { return urgencyScore; }
        public int getConfidenceLevel() { return confidenceLevel; }
        public List<String> getRiskFlags() { return riskFlags; }
        public String getRecommendation() { return recommendation; }
        public String getExplanation() { return explanation; }
}

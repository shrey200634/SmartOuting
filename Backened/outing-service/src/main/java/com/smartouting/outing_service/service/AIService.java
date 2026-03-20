package com.smartouting.outing_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartouting.outing_service.dto.AIAnalysisResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";
    // ─────────────────────────────────────────────────────────────
    // MAIN METHOD — tries Gemini first, falls back to rule-based
    // ─────────────────────────────────────────────────────────────

    public AIAnalysisResult analyzeRequest(String reason) {
        if (reason == null || reason.isBlank()) {
            return new AIAnalysisResult("INSUFFICIENT_INFO", 5, 10,
                    List.of("Empty or missing reason"), "REJECT", "No reason provided.");
        }

        // Try Gemini API first
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                AIAnalysisResult geminiResult = callGemini(reason);
                if (geminiResult != null) {
                    log.info("AI Analysis (Gemini): {} | Score: {} | Rec: {}",
                            geminiResult.getCategory(), geminiResult.getUrgencyScore(), geminiResult.getRecommendation());
                    return geminiResult;
                }
            } catch (Exception e) {
                log.warn("Gemini API failed, falling back to rule-based engine: {}", e.getMessage());
            }
        } else {
            log.info("No Gemini API key configured, using rule-based engine");
        }

        // Fallback to rule-based engine
        return analyzeWithRules(reason);
    }

    // ─────────────────────────────────────────────────────────────
    // GEMINI API CALL
    // ─────────────────────────────────────────────────────────────

    private AIAnalysisResult callGemini(String reason) throws Exception {
        String prompt = buildPrompt(reason);

        // Build request body
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentPart = Map.of("parts", List.of(textPart));
        Map<String, Object> requestBody = Map.of("contents", List.of(contentPart));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                GEMINI_URL + geminiApiKey,
                HttpMethod.POST,
                entity,
                String.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return parseGeminiResponse(response.getBody());
        }

        return null;
    }

    private String buildPrompt(String reason) {
        return """
                You are an AI assistant for a campus outing management system. Analyze this student's outing request reason and return a JSON response.
                
                Student's reason: "%s"
                
                Analyze the urgency, category, and whether this should be approved. Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with these exact fields:
                
                {
                  "category": "one of: MEDICAL_EMERGENCY, MEDICAL, HEALTH, FAMILY_EMERGENCY, FAMILY, ACADEMIC_PRIORITY, ACADEMIC, PERSONAL_LEISURE, SUSPICIOUS, UNCATEGORIZED",
                  "urgencyScore": number between 0-100,
                  "confidenceLevel": number between 0-100,
                  "riskFlags": ["array of risk flags if any, empty array if none"],
                  "recommendation": "one of: APPROVE, MANUAL_REVIEW, LOW_PRIORITY, REJECT",
                  "explanation": "brief explanation of your analysis"
                }
                
                Guidelines:
                - Medical emergencies (accident, surgery, chest pain, unconscious) = urgencyScore 75-100, recommend APPROVE
                - Family emergencies (death, funeral, parent critically ill) = urgencyScore 65-90, recommend APPROVE
                - Academic priority (final exam, job interview, placement) = urgencyScore 45-70, recommend MANUAL_REVIEW
                - Regular medical (doctor appointment, checkup, dental) = urgencyScore 30-55, recommend MANUAL_REVIEW
                - Personal/leisure (shopping, movie, hanging out, party) = urgencyScore 5-25, recommend LOW_PRIORITY
                - Suspicious (fake reasons, gibberish, harmful intent like "bunk", "escape") = urgencyScore 0-10, recommend REJECT, add risk flags
                - If the reason is vague or too short, set confidence low and recommend MANUAL_REVIEW
                
                Return ONLY the JSON object, nothing else.
                """.formatted(reason);
    }

    private AIAnalysisResult parseGeminiResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);

        // Extract text from Gemini response structure
        String text = root.path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text").asText("");

        // Clean up — remove markdown code fences if present
        text = text.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
        text = text.trim();

        // Extract JSON object if there's extra text around it
        int jsonStart = text.indexOf('{');
        int jsonEnd = text.lastIndexOf('}');
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        JsonNode json = objectMapper.readTree(text);

        String category = json.path("category").asText("UNCATEGORIZED");
        int urgencyScore = json.path("urgencyScore").asInt(20);
        int confidenceLevel = json.path("confidenceLevel").asInt(50);
        String recommendation = json.path("recommendation").asText("MANUAL_REVIEW");
        String explanation = json.path("explanation").asText("Analyzed by Gemini AI");

        // Parse risk flags
        List<String> riskFlags = new ArrayList<>();
        JsonNode flagsNode = json.path("riskFlags");
        if (flagsNode.isArray()) {
            for (JsonNode flag : flagsNode) {
                String f = flag.asText("");
                if (!f.isBlank()) riskFlags.add(f);
            }
        }

        // Clamp scores
        urgencyScore = Math.max(0, Math.min(100, urgencyScore));
        confidenceLevel = Math.max(0, Math.min(100, confidenceLevel));

        // Prepend source tag to explanation
        explanation = "[Gemini AI] " + explanation;

        return new AIAnalysisResult(category, urgencyScore, confidenceLevel,
                riskFlags, recommendation, explanation);
    }

    // ─────────────────────────────────────────────────────────────
    // RULE-BASED FALLBACK ENGINE (original logic)
    // ─────────────────────────────────────────────────────────────

    private static final Map<String, Integer> MEDICAL_TIER1 = new LinkedHashMap<>();
    static {
        MEDICAL_TIER1.put("ambulance", 30); MEDICAL_TIER1.put("emergency", 25);
        MEDICAL_TIER1.put("accident", 25);  MEDICAL_TIER1.put("unconscious", 30);
        MEDICAL_TIER1.put("bleeding", 22);  MEDICAL_TIER1.put("fracture", 20);
        MEDICAL_TIER1.put("broken bone", 22); MEDICAL_TIER1.put("heart attack", 30);
        MEDICAL_TIER1.put("chest pain", 25); MEDICAL_TIER1.put("severe pain", 22);
        MEDICAL_TIER1.put("surgery", 22);   MEDICAL_TIER1.put("operation", 20);
        MEDICAL_TIER1.put("icu", 28);       MEDICAL_TIER1.put("critical", 25);
        MEDICAL_TIER1.put("seizure", 25);   MEDICAL_TIER1.put("stroke", 28);
        MEDICAL_TIER1.put("poisoning", 25); MEDICAL_TIER1.put("choking", 25);
        MEDICAL_TIER1.put("collapsed", 25); MEDICAL_TIER1.put("fainted", 20);
    }

    private static final Map<String, Integer> MEDICAL_TIER2 = new LinkedHashMap<>();
    static {
        MEDICAL_TIER2.put("hospital", 15); MEDICAL_TIER2.put("doctor", 12);
        MEDICAL_TIER2.put("clinic", 12);   MEDICAL_TIER2.put("fever", 10);
        MEDICAL_TIER2.put("sick", 8);      MEDICAL_TIER2.put("vomiting", 12);
        MEDICAL_TIER2.put("vomit", 12);    MEDICAL_TIER2.put("pain", 8);
        MEDICAL_TIER2.put("injury", 12);   MEDICAL_TIER2.put("medicine", 10);
        MEDICAL_TIER2.put("prescription", 10); MEDICAL_TIER2.put("specialist", 12);
        MEDICAL_TIER2.put("dental", 10);   MEDICAL_TIER2.put("dentist", 10);
        MEDICAL_TIER2.put("checkup", 6);   MEDICAL_TIER2.put("appointment", 6);
        MEDICAL_TIER2.put("x-ray", 12);    MEDICAL_TIER2.put("mri", 12);
        MEDICAL_TIER2.put("blood test", 10); MEDICAL_TIER2.put("treatment", 10);
        MEDICAL_TIER2.put("medication", 10); MEDICAL_TIER2.put("nausea", 8);
        MEDICAL_TIER2.put("dizziness", 10); MEDICAL_TIER2.put("infection", 10);
        MEDICAL_TIER2.put("wound", 12);    MEDICAL_TIER2.put("therapy", 8);
        MEDICAL_TIER2.put("allergy", 8);   MEDICAL_TIER2.put("diagnosis", 10);
        MEDICAL_TIER2.put("blood", 10);
    }

    private static final Map<String, Integer> ACADEMIC_KEYWORDS = new LinkedHashMap<>();
    static {
        ACADEMIC_KEYWORDS.put("final exam", 20);    ACADEMIC_KEYWORDS.put("board exam", 20);
        ACADEMIC_KEYWORDS.put("entrance exam", 18); ACADEMIC_KEYWORDS.put("competitive exam", 18);
        ACADEMIC_KEYWORDS.put("exam", 12);           ACADEMIC_KEYWORDS.put("test", 8);
        ACADEMIC_KEYWORDS.put("interview", 15);      ACADEMIC_KEYWORDS.put("job interview", 18);
        ACADEMIC_KEYWORDS.put("placement", 15);      ACADEMIC_KEYWORDS.put("hackathon", 12);
        ACADEMIC_KEYWORDS.put("competition", 10);    ACADEMIC_KEYWORDS.put("seminar", 8);
        ACADEMIC_KEYWORDS.put("conference", 10);     ACADEMIC_KEYWORDS.put("presentation", 10);
        ACADEMIC_KEYWORDS.put("viva", 12);            ACADEMIC_KEYWORDS.put("thesis", 10);
        ACADEMIC_KEYWORDS.put("internship", 10);     ACADEMIC_KEYWORDS.put("certification", 10);
        ACADEMIC_KEYWORDS.put("project submission", 12); ACADEMIC_KEYWORDS.put("library", 5);
        ACADEMIC_KEYWORDS.put("lab", 6);             ACADEMIC_KEYWORDS.put("class", 5);
    }

    private static final Map<String, Integer> FAMILY_URGENT = new LinkedHashMap<>();
    static {
        FAMILY_URGENT.put("death", 25);           FAMILY_URGENT.put("funeral", 22);
        FAMILY_URGENT.put("passed away", 25);     FAMILY_URGENT.put("demise", 22);
        FAMILY_URGENT.put("bereavement", 20);     FAMILY_URGENT.put("family emergency", 22);
        FAMILY_URGENT.put("parent sick", 18);     FAMILY_URGENT.put("mother sick", 18);
        FAMILY_URGENT.put("father sick", 18);     FAMILY_URGENT.put("sibling sick", 15);
        FAMILY_URGENT.put("relative sick", 12);   FAMILY_URGENT.put("wedding", 8);
    }

    private static final Map<String, Integer> PERSONAL_LEISURE = new LinkedHashMap<>();
    static {
        PERSONAL_LEISURE.put("movie", 2);    PERSONAL_LEISURE.put("cinema", 2);
        PERSONAL_LEISURE.put("shopping", 2); PERSONAL_LEISURE.put("mall", 2);
        PERSONAL_LEISURE.put("party", 2);    PERSONAL_LEISURE.put("trip", 3);
        PERSONAL_LEISURE.put("picnic", 2);   PERSONAL_LEISURE.put("gym", 3);
        PERSONAL_LEISURE.put("restaurant", 2); PERSONAL_LEISURE.put("food", 2);
        PERSONAL_LEISURE.put("friends", 2);  PERSONAL_LEISURE.put("hangout", 2);
        PERSONAL_LEISURE.put("festival", 4); PERSONAL_LEISURE.put("concert", 4);
        PERSONAL_LEISURE.put("fun", 1);      PERSONAL_LEISURE.put("game", 2);
        PERSONAL_LEISURE.put("outing", 2);   PERSONAL_LEISURE.put("date", 2);
    }

    private static final Map<String, Integer> SEVERITY_AMPLIFIERS = new LinkedHashMap<>();
    static {
        SEVERITY_AMPLIFIERS.put("very severe", 20); SEVERITY_AMPLIFIERS.put("extremely severe", 22);
        SEVERITY_AMPLIFIERS.put("severe", 15);      SEVERITY_AMPLIFIERS.put("serious", 12);
        SEVERITY_AMPLIFIERS.put("urgent", 12);      SEVERITY_AMPLIFIERS.put("immediate", 14);
        SEVERITY_AMPLIFIERS.put("unbearable", 15);  SEVERITY_AMPLIFIERS.put("excruciating", 18);
        SEVERITY_AMPLIFIERS.put("high fever", 14);  SEVERITY_AMPLIFIERS.put("cannot walk", 16);
        SEVERITY_AMPLIFIERS.put("cannot stand", 14); SEVERITY_AMPLIFIERS.put("critical condition", 20);
    }

    private static final Map<String, Integer> CONTEXT_REDUCERS = new LinkedHashMap<>();
    static {
        CONTEXT_REDUCERS.put("routine", -10);    CONTEXT_REDUCERS.put("regular", -8);
        CONTEXT_REDUCERS.put("scheduled", -6);   CONTEXT_REDUCERS.put("normal", -8);
        CONTEXT_REDUCERS.put("minor", -10);      CONTEXT_REDUCERS.put("not serious", -15);
        CONTEXT_REDUCERS.put("not urgent", -20); CONTEXT_REDUCERS.put("can wait", -15);
        CONTEXT_REDUCERS.put("casual", -10);     CONTEXT_REDUCERS.put("leisure", -12);
        CONTEXT_REDUCERS.put("just a", -5);      CONTEXT_REDUCERS.put("only a", -5);
    }

    private static final Set<String> SUSPICIOUS_WORDS = new HashSet<>(Arrays.asList(
            "fake", "dummy", "blah", "xxx", "qwerty", "kill", "attack",
            "fight", "violent", "harm", "drugs", "alcohol", "illegal",
            "smuggle", "escape", "runaway", "bunk"
    ));

    private static final Set<String> CREDIBLE_LOCATIONS = new HashSet<>(Arrays.asList(
            "hospital", "clinic", "aiims", "apollo", "fortis",
            "railway station", "airport", "court", "police station",
            "government office", "bank", "embassy"
    ));

    private AIAnalysisResult analyzeWithRules(String reason) {
        String text = reason.toLowerCase().trim();
        List<String> flags = new ArrayList<>();

        int medT1 = weightedMatch(text, MEDICAL_TIER1);
        int medT2 = weightedMatch(text, MEDICAL_TIER2);
        int acad  = weightedMatch(text, ACADEMIC_KEYWORDS);
        int fam   = weightedMatch(text, FAMILY_URGENT);
        int leis  = weightedMatch(text, PERSONAL_LEISURE);

        String category;
        int baseScore;

        if (medT1 >= 20) { category = "MEDICAL_EMERGENCY"; baseScore = 60 + Math.min(medT1, 30); }
        else if (medT1 > 0 || medT2 >= 15) { category = "MEDICAL"; baseScore = 40 + Math.min(medT1 + medT2, 25); }
        else if (medT2 > 0) { category = "HEALTH"; baseScore = 30 + Math.min(medT2, 15); }
        else if (fam >= 20) { category = "FAMILY_EMERGENCY"; baseScore = 55 + Math.min(fam, 20); }
        else if (fam > 0) { category = "FAMILY"; baseScore = 35 + Math.min(fam, 20); }
        else if (acad >= 15) { category = "ACADEMIC_PRIORITY"; baseScore = 40 + Math.min(acad, 20); }
        else if (acad > 0) { category = "ACADEMIC"; baseScore = 25 + Math.min(acad, 20); }
        else if (leis > 0) { category = "PERSONAL_LEISURE"; baseScore = 10 + Math.min(leis, 15); }
        else { category = "UNCATEGORIZED"; baseScore = 15; }

        int severityBoost = Math.min(weightedMatch(text, SEVERITY_AMPLIFIERS), 25);
        int contextPenalty = weightedMatch(text, CONTEXT_REDUCERS);
        int wordCount = text.split("\\s+").length;
        int qualityBonus = 0;
        if (wordCount >= 10) qualityBonus += 5;
        if (wordCount >= 20) qualityBonus += 3;
        if (containsAny(text, CREDIBLE_LOCATIONS)) qualityBonus += 4;

        int riskPenalty = 0;
        for (String sw : SUSPICIOUS_WORDS) {
            if (text.contains(sw)) { flags.add("Suspicious keyword: \"" + sw + "\""); riskPenalty += 20; }
        }
        if (wordCount < 3) { flags.add("Description too vague"); riskPenalty += 10; }
        if ((category.startsWith("MEDICAL") || category.startsWith("HEALTH")) && leis > 0) {
            flags.add("Mixed signals: medical + leisure context"); riskPenalty += 8;
        }
        if (Pattern.compile("(.)\\1{3,}").matcher(text).find()) {
            flags.add("Possible gibberish detected"); riskPenalty += 12;
        }

        int urgency = Math.max(0, Math.min(100, baseScore + severityBoost + contextPenalty + qualityBonus - riskPenalty));

        int confidence = 50;
        if (!category.equals("UNCATEGORIZED")) confidence += 20;
        if (wordCount >= 8) confidence += 10;
        if (severityBoost > 0) confidence += 8;
        if (!flags.isEmpty()) confidence -= 10;
        confidence = Math.max(10, Math.min(99, confidence));

        String recommendation;
        if (riskPenalty >= 20) recommendation = "REJECT";
        else if (urgency >= 75 && flags.isEmpty()) recommendation = "APPROVE";
        else if (urgency >= 40) recommendation = "MANUAL_REVIEW";
        else recommendation = "LOW_PRIORITY";

        String explanation = "[Rule-Based] Category: " + category
                + " | Urgency: " + urgency + "/100"
                + " | Confidence: " + confidence + "%"
                + (severityBoost > 0 ? " | Severity boost: +" + severityBoost : "")
                + (riskPenalty > 0 ? " | Risk penalty: -" + riskPenalty : "")
                + (flags.isEmpty() ? "" : " | Flags: " + String.join("; ", flags));

        return new AIAnalysisResult(category, urgency, confidence, flags, recommendation, explanation);
    }

    private int weightedMatch(String text, Map<String, Integer> kwMap) {
        int total = 0;
        for (Map.Entry<String, Integer> entry : kwMap.entrySet()) {
            if (text.contains(entry.getKey())) total += entry.getValue();
        }
        return total;
    }

    private boolean containsAny(String text, Collection<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }
}

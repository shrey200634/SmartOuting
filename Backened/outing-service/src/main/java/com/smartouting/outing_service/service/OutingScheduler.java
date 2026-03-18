


package com.smartouting.outing_service.service;

import com.smartouting.outing_service.model.Outing;
import com.smartouting.outing_service.repository.OutingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OutingScheduler {

    @Autowired
    private OutingRepository repository;

    // 🕒 Runs every 1 minute (60,000 ms) to check for late students
    @Scheduled(fixedRate = 60000)
    public void markOverdueOutings() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Find everyone who is 'OUT' but should be back by 'now'
        List<Outing> lateStudents = repository.findByStatusAndReturnDateBefore("OUT", now);

        if (!lateStudents.isEmpty()) {
            System.out.println("🚨 SCHEDULER: Found " + lateStudents.size() + " late students!");
        }

        // 2. Mark them as OVERDUE
        for (Outing outing : lateStudents) {
            outing.setStatus("OVERDUE");
            outing.setWardenComment("System Auto-Flag: Student did not return by " + outing.getReturnDate());
            repository.save(outing);

            System.out.println("⚠️ FLAGGED: " + outing.getStudentName() + " is late! (Return Time: " + outing.getReturnDate() + ")");
        }
    }
}
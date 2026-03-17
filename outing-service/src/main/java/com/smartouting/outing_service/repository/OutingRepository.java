package com.smartouting.outing_service.repository;

import com.smartouting.outing_service.model.Outing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutingRepository extends JpaRepository<Outing, Long> {
    List<Outing> findByStudentId(String studentId);
    List<Outing> findByStatusAndReturnDateBefore(String status, LocalDateTime now);
    // FIX: catch both OUT and APPROVED that have expired
    List<Outing> findByStatusInAndReturnDateBefore(List<String> statuses, LocalDateTime now);
    long countByStudentIdAndStatus(String studentId, String status);
}
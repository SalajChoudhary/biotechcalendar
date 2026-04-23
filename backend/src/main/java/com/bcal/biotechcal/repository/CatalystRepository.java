package com.bcal.biotechcal.repository;

import com.bcal.biotechcal.entity.Catalyst;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface CatalystRepository extends JpaRepository<Catalyst, Long> {

    boolean existsByExternalId(String externalId);

    @Override
    @EntityGraph(attributePaths = "company")
    Page<Catalyst> findAll(Pageable pageable);

    @Query("""
            SELECT c FROM Catalyst c
            WHERE COALESCE(c.expectedDateEnd, c.expectedDateStart) BETWEEN :from AND :to
            ORDER BY COALESCE(c.expectedDateEnd, c.expectedDateStart) ASC
            """)
    @EntityGraph(attributePaths = "company")
    List<Catalyst> findInDateRange(LocalDate from, LocalDate to);

    @Query("""
            SELECT c FROM Catalyst c
            WHERE c.expectedDateStart IS NULL AND c.expectedDateEnd IS NULL
            ORDER BY c.drugName ASC
            """)
    @EntityGraph(attributePaths = "company")
    List<Catalyst> findUndated();
}

package com.bcal.biotechcal.repository;

import com.bcal.biotechcal.entity.Catalyst;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalystRepository extends JpaRepository<Catalyst, Long> {

    boolean existsByExternalId(String externalId);

    @Override
    @EntityGraph(attributePaths = "company")
    List<Catalyst> findAll();
}

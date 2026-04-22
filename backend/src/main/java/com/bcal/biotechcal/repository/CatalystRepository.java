package com.bcal.biotechcal.repository;

import com.bcal.biotechcal.entity.Catalyst;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalystRepository extends JpaRepository<Catalyst, Long> {
    boolean existsByExternalId(String externalId);
}

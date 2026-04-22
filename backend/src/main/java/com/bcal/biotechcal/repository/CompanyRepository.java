package com.bcal.biotechcal.repository;

import com.bcal.biotechcal.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
}

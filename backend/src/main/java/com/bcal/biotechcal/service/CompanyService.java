package com.bcal.biotechcal.service;

import com.bcal.biotechcal.dto.CompanyRequest;
import com.bcal.biotechcal.dto.CompanyResponse;
import com.bcal.biotechcal.entity.Company;
import com.bcal.biotechcal.exception.ResourceNotFoundException;
import com.bcal.biotechcal.repository.CompanyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Page<CompanyResponse> getCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll(Sort.by("name").ascending())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyResponse getCompanyById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        return mapToResponse(company);
    }

    public CompanyResponse createCompany(CompanyRequest request) {
        Company company = new Company();
        mapRequestToEntity(company, request);
        return mapToResponse(companyRepository.save(company));
    }

    public CompanyResponse updateCompany(Long id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        mapRequestToEntity(company, request);
        return mapToResponse(companyRepository.save(company));
    }

    public void deleteCompanyById(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Company not found with id: " + id);
        }
        companyRepository.deleteById(id);
    }

    private void mapRequestToEntity(Company company, CompanyRequest request) {
        company.setName(request.getName());
        company.setTicker(request.getTicker());
        company.setNotes(request.getNotes());
    }

    private CompanyResponse mapToResponse(Company company) {
        CompanyResponse response = new CompanyResponse();
        response.setId(company.getId());
        response.setName(company.getName());
        response.setTicker(company.getTicker());
        response.setNotes(company.getNotes());
        return response;
    }
}

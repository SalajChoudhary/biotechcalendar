package com.bcal.biotechcal.service;

import com.bcal.biotechcal.dto.CatalystRequest;
import com.bcal.biotechcal.dto.CatalystResponse;
import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.entity.Company;
import com.bcal.biotechcal.exception.ResourceNotFoundException;
import com.bcal.biotechcal.repository.CatalystRepository;
import com.bcal.biotechcal.repository.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CatalystService {

    private final CatalystRepository catalystRepository;
    private final CompanyRepository companyRepository;

    public CatalystService(CatalystRepository catalystRepository, CompanyRepository companyRepository) {
        this.catalystRepository = catalystRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalystResponse> getAllCatalysts() {
        return catalystRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CatalystResponse getCatalystById(Long id) {
        Catalyst catalyst = catalystRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catalyst not found with id: " + id));
        return mapToResponse(catalyst);
    }

    public CatalystResponse createCatalyst(CatalystRequest request) {
        Catalyst catalyst = new Catalyst();
        mapRequestToEntity(catalyst, request);
        return mapToResponse(catalystRepository.save(catalyst));
    }

    public CatalystResponse updateCatalyst(Long id, CatalystRequest request) {
        Catalyst existingCatalyst = catalystRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catalyst not found with id: " + id));

        mapRequestToEntity(existingCatalyst, request);

        return mapToResponse(catalystRepository.save(existingCatalyst));
    }

    public void deleteCatalystById(Long id) {
        if (!catalystRepository.existsById(id)) {
            throw new ResourceNotFoundException("Catalyst not found with id: " + id);
        }
        catalystRepository.deleteById(id);
    }

    private void mapRequestToEntity(Catalyst catalyst, CatalystRequest request) {
        catalyst.setCatalystType(request.getCatalystType());
        catalyst.setExpectedDateStart(request.getExpectedDateStart());
        catalyst.setExpectedDateEnd(request.getExpectedDateEnd());
        catalyst.setDrugName(request.getDrugName());
        catalyst.setNotes(request.getNotes());

        if (request.getCompanyId() != null) {
            Company company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Company not found with id: " + request.getCompanyId()));
            catalyst.setCompany(company);
        }
    }

    private CatalystResponse mapToResponse(Catalyst catalyst) {
        CatalystResponse response = new CatalystResponse();
        response.setId(catalyst.getId());
        response.setCatalystType(catalyst.getCatalystType());
        response.setExpectedDateStart(catalyst.getExpectedDateStart());
        response.setExpectedDateEnd(catalyst.getExpectedDateEnd());
        response.setDrugName(catalyst.getDrugName());
        response.setNotes(catalyst.getNotes());

        if (catalyst.getCompany() != null) {
            response.setCompanyName(catalyst.getCompany().getName());
            response.setCompanyTicker(catalyst.getCompany().getTicker());
        }
        response.setSource(catalyst.getSource());
        response.setExternalId(catalyst.getExternalId());

        return response;
    }
}

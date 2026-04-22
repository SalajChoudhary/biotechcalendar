package com.bcal.biotechcal.service;

import com.bcal.biotechcal.dto.CatalystRequest;
import com.bcal.biotechcal.dto.CatalystResponse;
import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.entity.Company;
import com.bcal.biotechcal.exception.ResourceNotFoundException;
import com.bcal.biotechcal.repository.CatalystRepository;
import com.bcal.biotechcal.repository.CompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CatalystServiceTest {

    private CatalystRepository catalystRepository;
    private CompanyRepository companyRepository;
    private CatalystService service;

    @BeforeEach
    void setUp() {
        catalystRepository = mock(CatalystRepository.class);
        companyRepository = mock(CompanyRepository.class);
        service = new CatalystService(catalystRepository, companyRepository);
    }

    @Test
    void updateCatalystPersistsChangesWithoutCreatingNew() {
        Company company = newCompany(1L, "ACME", "Acme Biotech");
        Catalyst existing = newCatalyst(42L, company, "Phase 2", LocalDate.of(2026, 1, 1));
        when(catalystRepository.findById(42L)).thenReturn(Optional.of(existing));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(catalystRepository.save(any(Catalyst.class))).thenAnswer(inv -> inv.getArgument(0));

        CatalystRequest request = new CatalystRequest();
        request.setCatalystType("Phase 3");
        request.setDrugName("Acmezumab");
        request.setCompanyId(1L);
        request.setExpectedDateStart(LocalDate.of(2026, 6, 1));
        request.setExpectedDateEnd(LocalDate.of(2026, 6, 10));

        CatalystResponse response = service.updateCatalyst(42L, request);

        assertThat(response.getId()).isEqualTo(42L);
        assertThat(response.getCatalystType()).isEqualTo("Phase 3");
        assertThat(response.getExpectedDateStart()).isEqualTo(LocalDate.of(2026, 6, 1));
        verify(catalystRepository).save(existing);
    }

    @Test
    void updateCatalystThrowsWhenNotFound() {
        when(catalystRepository.findById(42L)).thenReturn(Optional.empty());

        CatalystRequest request = new CatalystRequest();
        request.setCatalystType("Phase 3");
        request.setDrugName("Drug");
        request.setCompanyId(1L);
        request.setExpectedDateStart(LocalDate.of(2026, 1, 1));

        assertThatThrownBy(() -> service.updateCatalyst(42L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Catalyst not found with id: 42");
    }

    @Test
    void updateCatalystThrowsWhenCompanyNotFound() {
        Catalyst existing = newCatalyst(42L, newCompany(1L, "ACME", "Acme"), "Phase 2", LocalDate.now());
        when(catalystRepository.findById(42L)).thenReturn(Optional.of(existing));
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        CatalystRequest request = new CatalystRequest();
        request.setCatalystType("Phase 3");
        request.setDrugName("Drug");
        request.setCompanyId(99L);
        request.setExpectedDateStart(LocalDate.of(2026, 1, 1));

        assertThatThrownBy(() -> service.updateCatalyst(42L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Company not found with id: 99");
    }

    @Test
    void deleteThrowsWhenMissing() {
        when(catalystRepository.existsById(42L)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteCatalystById(42L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private Company newCompany(Long id, String ticker, String name) {
        Company c = new Company();
        c.setId(id);
        c.setTicker(ticker);
        c.setName(name);
        return c;
    }

    private Catalyst newCatalyst(Long id, Company company, String type, LocalDate start) {
        Catalyst c = new Catalyst();
        c.setId(id);
        c.setCatalystType(type);
        c.setDrugName("Existing Drug");
        c.setExpectedDateStart(start);
        c.setCompany(company);
        return c;
    }
}

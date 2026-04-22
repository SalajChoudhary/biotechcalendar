package com.bcal.biotechcal.service;

import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.entity.Company;
import com.bcal.biotechcal.exception.ExternalServiceException;
import com.bcal.biotechcal.exception.ResourceNotFoundException;
import com.bcal.biotechcal.repository.CatalystRepository;
import com.bcal.biotechcal.repository.CompanyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ClinicalTrialImportServiceTest {

    private CatalystRepository catalystRepository;
    private CompanyRepository companyRepository;
    private RestClient.Builder builder;
    private MockRestServiceServer server;
    private ClinicalTrialImportService service;

    @BeforeEach
    void setUp() {
        catalystRepository = mock(CatalystRepository.class);
        companyRepository = mock(CompanyRepository.class);
        builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new ClinicalTrialImportService(builder, catalystRepository, companyRepository, new ObjectMapper());
    }

    @Test
    void throwsResourceNotFoundWhenCompanyMissing() {
        when(companyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.importForCompany(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void throwsExternalServiceExceptionOnHttpError() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(newCompany()));
        server.expect(method(GET))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> service.importForCompany(1L))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessageContaining("500");

        verify(catalystRepository, never()).save(any());
    }

    @Test
    void throwsExternalServiceExceptionOnEmptyBody() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(newCompany()));
        server.expect(method(GET))
                .andRespond(withSuccess("", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.importForCompany(1L))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessageContaining("empty response");
    }

    @Test
    void importsSingleStudyFromSuccessfulResponse() {
        Company company = newCompany();
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(catalystRepository.existsByExternalId("NCT01")).thenReturn(false);
        when(catalystRepository.save(any(Catalyst.class))).thenAnswer(inv -> inv.getArgument(0));

        String body = """
                {
                  "studies": [{
                    "protocolSection": {
                      "identificationModule": {"nctId": "NCT01", "briefTitle": "Trial 1"},
                      "statusModule": {
                        "overallStatus": "RECRUITING",
                        "startDateStruct": {"date": "2026-01-01"},
                        "primaryCompletionDateStruct": {"date": "2026-06-01"}
                      },
                      "designModule": {"phases": ["PHASE3"]},
                      "armsInterventionsModule": {"interventions": [{"type": "DRUG", "name": "Drug-A"}]}
                    }
                  }]
                }
                """;
        server.expect(requestTo(org.hamcrest.Matchers.containsString("query.spons=Acme%20Biotech")))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        List<Catalyst> imported = service.importForCompany(1L);

        assertThat(imported).hasSize(1);
        assertThat(imported.getFirst().getExternalId()).isEqualTo("NCT01");
        assertThat(imported.getFirst().getDrugName()).isEqualTo("Drug-A");
        assertThat(imported.getFirst().getCatalystType()).isEqualTo("Phase 3 - Recruiting");
    }

    @Test
    void followsPaginationUntilNoNextToken() {
        Company company = newCompany();
        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(catalystRepository.existsByExternalId(any())).thenReturn(false);
        when(catalystRepository.save(any(Catalyst.class))).thenAnswer(inv -> inv.getArgument(0));

        String page1 = """
                {
                  "studies": [{
                    "protocolSection": {
                      "identificationModule": {"nctId": "NCT01", "briefTitle": "T1"},
                      "statusModule": {"overallStatus": "COMPLETED"},
                      "designModule": {"phases": ["PHASE2"]}
                    }
                  }],
                  "nextPageToken": "page2token"
                }
                """;
        String page2 = """
                {
                  "studies": [{
                    "protocolSection": {
                      "identificationModule": {"nctId": "NCT02", "briefTitle": "T2"},
                      "statusModule": {"overallStatus": "COMPLETED"},
                      "designModule": {"phases": ["PHASE2"]}
                    }
                  }]
                }
                """;
        server.expect(requestTo(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("pageToken"))))
                .andRespond(withSuccess(page1, MediaType.APPLICATION_JSON));
        server.expect(requestTo(org.hamcrest.Matchers.containsString("pageToken=page2token")))
                .andRespond(withSuccess(page2, MediaType.APPLICATION_JSON));

        List<Catalyst> imported = service.importForCompany(1L);

        assertThat(imported).hasSize(2);
        server.verify();
    }

    @Test
    void skipsAlreadyImportedStudies() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(newCompany()));
        when(catalystRepository.existsByExternalId("NCT01")).thenReturn(true);

        String body = """
                {
                  "studies": [{
                    "protocolSection": {
                      "identificationModule": {"nctId": "NCT01", "briefTitle": "T1"},
                      "statusModule": {"overallStatus": "COMPLETED"},
                      "designModule": {"phases": ["PHASE2"]}
                    }
                  }]
                }
                """;
        server.expect(method(GET)).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        List<Catalyst> imported = service.importForCompany(1L);

        assertThat(imported).isEmpty();
        verify(catalystRepository, never()).save(any());
    }

    private Company newCompany() {
        Company company = new Company();
        company.setId(1L);
        company.setTicker("ACME");
        company.setName("Acme Biotech");
        return company;
    }
}

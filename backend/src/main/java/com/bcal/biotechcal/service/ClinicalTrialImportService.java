package com.bcal.biotechcal.service;

import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.entity.CatalystSource;
import com.bcal.biotechcal.entity.Company;
import com.bcal.biotechcal.exception.ExternalServiceException;
import com.bcal.biotechcal.exception.ResourceNotFoundException;
import com.bcal.biotechcal.repository.CatalystRepository;
import com.bcal.biotechcal.repository.CompanyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClinicalTrialImportService {

    private static final Logger log = LoggerFactory.getLogger(ClinicalTrialImportService.class);
    private static final String API_BASE = "https://clinicaltrials.gov/api/v2/studies";
    private static final int PAGE_SIZE = 100;
    private static final int MAX_PAGES = 50;

    private final RestClient restClient;
    private final CatalystRepository catalystRepository;
    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    public ClinicalTrialImportService(
            RestClient.Builder restClientBuilder,
            CatalystRepository catalystRepository,
            CompanyRepository companyRepository,
            ObjectMapper objectMapper) {
        this.restClient = restClientBuilder.baseUrl(API_BASE).build();
        this.catalystRepository = catalystRepository;
        this.companyRepository = companyRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public List<Catalyst> importForCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));

        log.info("Importing clinical trials for company: {} ({})", company.getName(), company.getTicker());

        List<Catalyst> imported = new ArrayList<>();
        String pageToken = null;

        for (int page = 0; page < MAX_PAGES; page++) {
            String json = fetchPage(company.getName(), pageToken);
            JsonNode root = parse(json);

            imported.addAll(saveStudies(root.path("studies"), company));

            String next = root.path("nextPageToken").asText(null);
            if (next == null || next.isBlank()) {
                break;
            }
            pageToken = next;
        }

        log.info("Imported {} new trials for {}", imported.size(), company.getName());
        return imported;
    }

    private String fetchPage(String sponsorName, String pageToken) {
        try {
            String body = restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder
                                .queryParam("query.spons", sponsorName)
                                .queryParam("pageSize", PAGE_SIZE);
                        if (pageToken != null) {
                            uriBuilder.queryParam("pageToken", pageToken);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (request, response) -> {
                        throw new ExternalServiceException(
                                "ClinicalTrials.gov returned " + response.getStatusCode()
                                        + " for sponsor '" + sponsorName + "'");
                    })
                    .body(String.class);

            if (body == null || body.isBlank()) {
                throw new ExternalServiceException(
                        "ClinicalTrials.gov returned an empty response for sponsor '" + sponsorName + "'");
            }
            return body;
        } catch (ExternalServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new ExternalServiceException(
                    "Failed to reach ClinicalTrials.gov: " + e.getMessage(), e);
        }
    }

    private JsonNode parse(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (IOException e) {
            throw new ExternalServiceException("Failed to parse ClinicalTrials.gov response", e);
        }
    }

    private List<Catalyst> saveStudies(JsonNode studies, Company company) {
        List<Catalyst> imported = new ArrayList<>();
        if (!studies.isArray()) {
            return imported;
        }

        for (JsonNode study : studies) {
            JsonNode protocol = study.path("protocolSection");

            String nctId = protocol.at("/identificationModule/nctId").asText(null);
            if (nctId == null || catalystRepository.existsByExternalId(nctId)) {
                continue;
            }

            String title = protocol.at("/identificationModule/briefTitle").asText("Unknown");
            String status = protocol.at("/statusModule/overallStatus").asText("UNKNOWN");

            JsonNode phases = protocol.at("/designModule/phases");
            String phase = (phases.isArray() && !phases.isEmpty())
                    ? formatPhase(phases.get(0).asText())
                    : "N/A";

            JsonNode interventions = protocol.at("/armsInterventionsModule/interventions");
            String drugName = extractDrugName(interventions, title);

            LocalDate startDate = parseDate(protocol.at("/statusModule/startDateStruct/date").asText(null));
            LocalDate completionDate = parseDate(protocol.at("/statusModule/primaryCompletionDateStruct/date").asText(null));

            Catalyst catalyst = new Catalyst();
            catalyst.setExternalId(nctId);
            catalyst.setSource(CatalystSource.CLINICALTRIALS_GOV);
            catalyst.setDrugName(drugName);
            catalyst.setCatalystType(phase + " - " + formatStatus(status));
            catalyst.setExpectedDateStart(startDate);
            catalyst.setExpectedDateEnd(completionDate);
            catalyst.setCompany(company);
            catalyst.setNotes(nctId + ": " + truncate(title, 500));

            imported.add(catalystRepository.save(catalyst));
        }

        return imported;
    }

    private String extractDrugName(JsonNode interventions, String fallback) {
        if (interventions.isArray()) {
            for (JsonNode intervention : interventions) {
                if ("DRUG".equals(intervention.path("type").asText())) {
                    return truncate(intervention.path("name").asText(fallback), 255);
                }
            }
        }
        return truncate(fallback, 255);
    }

    private String formatPhase(String phase) {
        return switch (phase) {
            case "EARLY_PHASE1" -> "Early Phase 1";
            case "PHASE1" -> "Phase 1";
            case "PHASE2" -> "Phase 2";
            case "PHASE3" -> "Phase 3";
            case "PHASE4" -> "Phase 4";
            default -> "N/A";
        };
    }

    private String formatStatus(String status) {
        return switch (status) {
            case "RECRUITING" -> "Recruiting";
            case "ACTIVE_NOT_RECRUITING" -> "Active";
            case "COMPLETED" -> "Completed";
            case "TERMINATED" -> "Terminated";
            case "NOT_YET_RECRUITING" -> "Not Yet Recruiting";
            case "WITHDRAWN" -> "Withdrawn";
            default -> status;
        };
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            try {
                return YearMonth.parse(dateStr).atDay(1);
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }

    private String truncate(String value, int maxLength) {
        return value != null && value.length() > maxLength ? value.substring(0, maxLength) : value;
    }
}

package com.bcal.biotechcal.service;

import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.entity.CatalystSource;
import com.bcal.biotechcal.entity.Company;
import com.bcal.biotechcal.exception.ResourceNotFoundException;
import com.bcal.biotechcal.repository.CatalystRepository;
import com.bcal.biotechcal.repository.CompanyRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClinicalTrialImportService {

    private static final Logger log = LoggerFactory.getLogger(ClinicalTrialImportService.class);
    private static final String API_BASE = "https://clinicaltrials.gov/api/v2/studies";

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

    public List<Catalyst> importForCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));

        log.info("Importing clinical trials for company: {} ({})", company.getName(), company.getTicker());

        String json = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("query.spons", company.getName())
                        .queryParam("pageSize", "100")
                        .build())
                .retrieve()
                .body(String.class);

        return parseAndSave(json, company);
    }

    private List<Catalyst> parseAndSave(String json, Company company) {
        List<Catalyst> imported = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode studies = root.path("studies");

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

            log.info("Imported {} new trials for {}", imported.size(), company.getName());
        } catch (Exception e) {
            log.error("Failed to parse ClinicalTrials.gov response", e);
            throw new RuntimeException("Failed to import clinical trials: " + e.getMessage(), e);
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
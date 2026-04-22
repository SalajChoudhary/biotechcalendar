package com.bcal.biotechcal.controller;

import com.bcal.biotechcal.dto.ImportResult;
import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.service.ClinicalTrialImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final ClinicalTrialImportService importService;

    public ImportController(ClinicalTrialImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/clinicaltrials/{companyId}")
    public ResponseEntity<ImportResult> importForCompany(@PathVariable Long companyId) {
        List<Catalyst> imported = importService.importForCompany(companyId);
        return ResponseEntity.ok(new ImportResult(
                imported.size(),
                "Imported " + imported.size() + " new clinical trials from ClinicalTrials.gov"
        ));
    }
}
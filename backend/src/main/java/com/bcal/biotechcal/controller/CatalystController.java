package com.bcal.biotechcal.controller;

import com.bcal.biotechcal.dto.CatalystRequest;
import com.bcal.biotechcal.dto.CatalystResponse;
import com.bcal.biotechcal.dto.PageResponse;
import com.bcal.biotechcal.service.CatalystService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/catalysts")
public class CatalystController {

    private final CatalystService catalystService;

    public CatalystController(CatalystService catalystService) {
        this.catalystService = catalystService;
    }

    @GetMapping("")
    public ResponseEntity<PageResponse<CatalystResponse>> getCatalysts(
            @PageableDefault(size = 25, sort = "expectedDateStart", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(PageResponse.from(catalystService.getCatalysts(pageable)));
    }

    @GetMapping("/range")
    public ResponseEntity<List<CatalystResponse>> getCatalystsInRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(catalystService.getCatalystsInRange(from, to));
    }

    @GetMapping("/undated")
    public ResponseEntity<List<CatalystResponse>> getUndatedCatalysts() {
        return ResponseEntity.ok(catalystService.getUndatedCatalysts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CatalystResponse> getCatalystById(@PathVariable Long id) {
        return ResponseEntity.ok(catalystService.getCatalystById(id));
    }

    @PostMapping("")
    public ResponseEntity<CatalystResponse> createCatalyst(@Valid @RequestBody CatalystRequest request) {
        return ResponseEntity.status(201).body(catalystService.createCatalyst(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CatalystResponse> updateCatalyst(@PathVariable Long id,
                                                           @Valid @RequestBody CatalystRequest request) {
        return ResponseEntity.ok(catalystService.updateCatalyst(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCatalystById(@PathVariable Long id) {
        catalystService.deleteCatalystById(id);
        return ResponseEntity.noContent().build();
    }
}

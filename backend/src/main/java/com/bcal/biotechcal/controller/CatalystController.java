package com.bcal.biotechcal.controller;

import com.bcal.biotechcal.dto.CatalystRequest;
import com.bcal.biotechcal.dto.CatalystResponse;
import com.bcal.biotechcal.entity.Catalyst;
import com.bcal.biotechcal.service.CatalystService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/catalysts")
public class CatalystController {

    private final CatalystService catalystService;

    public CatalystController(CatalystService catalystService) {
        this.catalystService = catalystService;
    }

    @GetMapping("")
    public ResponseEntity<List<CatalystResponse>> getAllCatalysts() {
        return ResponseEntity.ok(catalystService.getAllCatalysts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CatalystResponse> getCatalystById(@PathVariable Long id) {
        return ResponseEntity.ok(catalystService.getCatalystById(id));
    }

    @PostMapping("")
    public ResponseEntity<CatalystResponse> createCatalyst(@RequestBody CatalystRequest request) {
        return ResponseEntity.status(201).body(catalystService.createCatalyst(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CatalystResponse> updateCatalyst(@PathVariable Long id,
                                                           @RequestBody CatalystRequest request) {
        return ResponseEntity.ok(catalystService.updateCatalyst(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCatalystById(@PathVariable Long id) {
        catalystService.deleteCatalystById(id);
        return ResponseEntity.noContent().build();
    }
}

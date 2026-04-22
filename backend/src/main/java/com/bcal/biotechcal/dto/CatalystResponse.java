package com.bcal.biotechcal.dto;

import com.bcal.biotechcal.entity.CatalystSource;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CatalystResponse {
    private Long id;
    private String catalystType;
    private LocalDate expectedDateStart;
    private LocalDate expectedDateEnd;
    private String drugName;
    private String companyName;
    private String companyTicker;
    private String notes;
    private CatalystSource source;
    private String externalId;
}

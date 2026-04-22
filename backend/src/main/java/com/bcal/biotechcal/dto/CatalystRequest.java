package com.bcal.biotechcal.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CatalystRequest {
    private String catalystType;
    private LocalDate expectedDateStart;
    private LocalDate expectedDateEnd;
    private String drugName;
    private Long companyId;
    private String notes;

}

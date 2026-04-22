package com.bcal.biotechcal.dto;

import lombok.Data;

@Data
public class CompanyRequest {
    private String ticker;
    private String name;
    private String notes;
}

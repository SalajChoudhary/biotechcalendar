package com.bcal.biotechcal.dto;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class CompanyResponse {
    private Long id;
    private String ticker;
    private String name;
    private String notes;
}

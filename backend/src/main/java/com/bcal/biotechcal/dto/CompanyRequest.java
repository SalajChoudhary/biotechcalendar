package com.bcal.biotechcal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CompanyRequest {

    @NotBlank
    @Size(max = 20)
    private String ticker;

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String notes;
}

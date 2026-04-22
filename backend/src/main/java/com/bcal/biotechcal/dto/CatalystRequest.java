package com.bcal.biotechcal.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CatalystRequest {

    @NotBlank
    @Size(max = 100)
    private String catalystType;

    @NotNull
    private LocalDate expectedDateStart;

    private LocalDate expectedDateEnd;

    @NotBlank
    @Size(max = 255)
    private String drugName;

    @NotNull
    private Long companyId;

    @Size(max = 2000)
    private String notes;

    @AssertTrue(message = "expectedDateEnd must be on or after expectedDateStart")
    public boolean isDateRangeValid() {
        if (expectedDateStart == null || expectedDateEnd == null) {
            return true;
        }
        return !expectedDateEnd.isBefore(expectedDateStart);
    }
}

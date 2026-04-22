package com.bcal.biotechcal.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CatalystRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsNullEndDate() {
        CatalystRequest request = validRequest();
        request.setExpectedDateEnd(null);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void acceptsEndEqualToStart() {
        CatalystRequest request = validRequest();
        request.setExpectedDateEnd(request.getExpectedDateStart());

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void rejectsEndBeforeStart() {
        CatalystRequest request = validRequest();
        request.setExpectedDateStart(LocalDate.of(2026, 5, 10));
        request.setExpectedDateEnd(LocalDate.of(2026, 5, 1));

        Set<ConstraintViolation<CatalystRequest>> violations = validator.validate(request);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains("expectedDateEnd must be on or after expectedDateStart");
    }

    @Test
    void rejectsMissingRequiredFields() {
        CatalystRequest request = new CatalystRequest();

        Set<ConstraintViolation<CatalystRequest>> violations = validator.validate(request);

        assertThat(violations)
                .extracting(v -> v.getPropertyPath().toString())
                .contains("catalystType", "drugName", "companyId", "expectedDateStart");
    }

    private CatalystRequest validRequest() {
        CatalystRequest request = new CatalystRequest();
        request.setCatalystType("Phase 3");
        request.setDrugName("Acmezumab");
        request.setCompanyId(1L);
        request.setExpectedDateStart(LocalDate.of(2026, 5, 1));
        request.setExpectedDateEnd(LocalDate.of(2026, 5, 10));
        return request;
    }
}

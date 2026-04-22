package com.bcal.biotechcal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImportResult {
    private int imported;
    private String message;
}
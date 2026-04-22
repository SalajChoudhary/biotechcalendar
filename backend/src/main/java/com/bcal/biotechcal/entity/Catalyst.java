package com.bcal.biotechcal.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class Catalyst {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String catalystType;
    @Column()
    private LocalDate expectedDateStart;
    @Column()
    private LocalDate expectedDateEnd;
    @Column(nullable = false)
    private String drugName;
    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;
    @Column()
    private String notes;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'MANUAL'")
    private CatalystSource source = CatalystSource.MANUAL;
    @Column()
    private String externalId;
}

package com.tacbarber.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "servicio")
public class Servicio extends PanacheEntity {

    @Column(nullable = false)
    public String nombre;

    @Column(name = "duracion_min", nullable = false)
    public Integer duracionMin;

    @Column(nullable = false, precision = 10, scale = 2)
    public BigDecimal precio;

    @Column(nullable = false)
    public boolean activo = true;
}

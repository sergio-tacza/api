package com.tacbarber.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cliente")
public class Cliente extends PanacheEntity {

    @Column(nullable = false)
    public String nombre;

    public String apellidos;

    @Column(nullable = false, length = 20)
    public String telefono;

    public String email;

    @Column(name = "fecha_alta")
    public LocalDateTime fechaAlta;

    @Column(columnDefinition = "text")
    public String notas;

    @Column(nullable = false)
    public boolean activo = true;
}

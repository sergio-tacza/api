package com.tacbarber.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario")
public class Usuario extends PanacheEntity {

    public String nombre;

    public String apellidos;

    @Column(nullable = false, unique = true)
    public String email;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public Rol rol;

    @Column(length = 20)
    public String telefono;

    @Column(name = "fecha_alta")
    public LocalDateTime fechaAlta;

    @Column(nullable = false)
    public boolean activo = true;

}

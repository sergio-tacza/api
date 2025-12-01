package com.tacbarber.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "token_recuperacion")
public class TokenRecuperacion extends PanacheEntity {

    @ManyToOne
    public Usuario usuario;

    public String token;

    @Column(name = "fecha_expiracion")
    public LocalDateTime fechaExpiracion;

    public boolean usado;

    // Mé
    public static TokenRecuperacion findByTokenValido(String token) {
        return find("token = ?1 AND usado = false AND fechaExpiracion > ?2",
                token, LocalDateTime.now())
                .firstResult();
    }
}

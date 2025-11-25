package com.tacbarber.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cita")
public class Cita extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cita_seq")
    @SequenceGenerator(name = "cita_seq", sequenceName = "cita_seq", allocationSize = 1)
    public Long id;

    @Column(name = "fecha_hora_inicio", nullable = false)
    public LocalDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin", nullable = false)
    public LocalDateTime fechaHoraFin;

    @Column(nullable = false, length = 20)
    public String estado;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    public Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "servicio_id", nullable = false)
    public Servicio servicio;

    @ManyToOne
    @JoinColumn(name = "barbero_id")
    public Usuario barbero;

    @Column(columnDefinition = "TEXT")
    public String notas;

    @Column(name = "recordatorio_enviado" , nullable = false)
    public Boolean recordatorioEnviado = false;
}

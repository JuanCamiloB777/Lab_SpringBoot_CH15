package com.cuerpoactivo.cuerpo_activo_api.dto;

import com.cuerpoactivo.cuerpo_activo_api.model.Plan;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record PlanRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @Positive(message = "La duración debe ser mayor que cero")
        int duracionMeses,

        @Positive(message = "El precio debe ser mayor que cero")
        int precio) {

    public Plan aEntidad() {
        Plan plan = new Plan();
        plan.setNombre(nombre);
        plan.setDuracionMeses(duracionMeses);
        plan.setPrecio(precio);
        return plan;
    }
}

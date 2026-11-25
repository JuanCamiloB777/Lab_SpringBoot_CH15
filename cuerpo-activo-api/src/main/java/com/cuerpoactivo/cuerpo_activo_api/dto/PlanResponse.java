package com.cuerpoactivo.cuerpo_activo_api.dto;

import com.cuerpoactivo.cuerpo_activo_api.model.Plan;

public record PlanResponse(Long id, String nombre, int duracionMeses, int precio) {

    public static PlanResponse desde(Plan plan) {
        return new PlanResponse(plan.getId(), plan.getNombre(),
                plan.getDuracionMeses(), plan.getPrecio());
    }
}

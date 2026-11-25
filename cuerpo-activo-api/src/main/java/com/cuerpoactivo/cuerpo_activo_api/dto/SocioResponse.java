package com.cuerpoactivo.cuerpo_activo_api.dto;

import com.cuerpoactivo.cuerpo_activo_api.model.Socio;

public record SocioResponse(Long id, String nombre, String plan) {

    public static SocioResponse desde(Socio socio) {
        String nombrePlan = null;
        if (socio.getPlan() != null) {
            nombrePlan = socio.getPlan().getNombre();
        }
        return new SocioResponse(socio.getId(), socio.getNombre(), nombrePlan);
    }
}

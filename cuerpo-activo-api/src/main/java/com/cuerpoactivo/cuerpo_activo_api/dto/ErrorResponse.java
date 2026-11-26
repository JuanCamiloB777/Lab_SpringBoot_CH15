package com.cuerpoactivo.cuerpo_activo_api.dto;

import java.util.Map;

public record ErrorResponse(int status, String mensaje, Map<String, String> campos) {
}

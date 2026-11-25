package com.cuerpoactivo.cuerpo_activo_api.controller;

import com.cuerpoactivo.cuerpo_activo_api.dto.SocioRequest;
import com.cuerpoactivo.cuerpo_activo_api.dto.SocioResponse;
import com.cuerpoactivo.cuerpo_activo_api.model.Socio;
import com.cuerpoactivo.cuerpo_activo_api.service.SocioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/socios")
public class SocioController {
    private final SocioService socioService;

    public SocioController(SocioService socioService){
        this.socioService = socioService;
    }

    @GetMapping
    public List<SocioResponse> listar(){
        return socioService.listar()
                .stream()
                .map(SocioResponse::desde)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SocioResponse> buscarPorId(@PathVariable Long id){
        Optional<Socio> encontrado = socioService.buscarPorId(id);
        if(encontrado.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(SocioResponse.desde(encontrado.get()));
    }

    @PostMapping
    public ResponseEntity<SocioResponse> crear(@RequestBody SocioRequest request){
        Optional<Socio> creado = socioService.crear(request);
        if(creado.isEmpty()){
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(SocioResponse.desde(creado.get()));
    }
}

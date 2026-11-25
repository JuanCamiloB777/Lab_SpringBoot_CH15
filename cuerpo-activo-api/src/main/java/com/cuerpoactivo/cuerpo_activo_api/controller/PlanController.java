package com.cuerpoactivo.cuerpo_activo_api.controller;

import com.cuerpoactivo.cuerpo_activo_api.dto.PlanRequest;
import com.cuerpoactivo.cuerpo_activo_api.dto.PlanResponse;
import com.cuerpoactivo.cuerpo_activo_api.model.Plan;
import com.cuerpoactivo.cuerpo_activo_api.service.PlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/planes")
public class PlanController {
    private final PlanService planService;

    public PlanController(PlanService planService){
        this.planService = planService;
    }

    @GetMapping
    public List<PlanResponse> listar(){
        return planService.listar()
                .stream()
                .map(PlanResponse::desde)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanResponse> buscarPorId(@PathVariable Long id){
        Optional<Plan> encontrado = planService.buscarId(id);
        if(encontrado.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(PlanResponse.desde(encontrado.get()));
    }

    @PostMapping
    public ResponseEntity<PlanResponse> crear(@RequestBody PlanRequest request){
        Plan creado = planService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(PlanResponse.desde(creado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanResponse> actualizar(@PathVariable Long id, @RequestBody PlanRequest datos){
        Optional<Plan> actualizado = planService.actualizar(id, datos);
        if(actualizado.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(PlanResponse.desde(actualizado.get()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id){
        boolean eliminado = planService.eliminar(id);
        if(!eliminado){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}

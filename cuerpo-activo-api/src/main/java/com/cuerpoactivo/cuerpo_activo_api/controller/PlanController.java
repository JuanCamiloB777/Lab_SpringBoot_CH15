package com.cuerpoactivo.cuerpo_activo_api.controller;

import com.cuerpoactivo.cuerpo_activo_api.model.Plan;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.cuerpoactivo.cuerpo_activo_api.service.PlanService;

import javax.print.DocFlavor;
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
    public List<Plan> Listar(){
        return planService.listar();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Plan> validarPlan(@PathVariable Long id){
        Optional<Plan> numero = planService.buscarId(id);
        if(numero.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(numero.get());
    }

    @PostMapping
    public ResponseEntity<Plan> crear(@RequestBody Plan nuevo){
        Plan creado = planService.crear(nuevo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Plan> actualizar(@PathVariable Long id,@RequestBody Plan datos){
        Optional<Plan> actualiza = planService.actualizar(id,datos);
        if (actualiza.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(actualiza.get());
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

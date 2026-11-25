package com.cuerpoactivo.cuerpo_activo_api.service;

import com.cuerpoactivo.cuerpo_activo_api.dto.PlanRequest;
import com.cuerpoactivo.cuerpo_activo_api.model.Plan;
import com.cuerpoactivo.cuerpo_activo_api.repository.PlanRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlanService {
    private final PlanRepository planRepository;

    public PlanService(PlanRepository planRepository){
        this.planRepository = planRepository;
    }

    public List<Plan> listar(){
        return planRepository.findAll();
    }

    public Optional<Plan> buscarId(Long id){
        return planRepository.findById(id);
    }

    public Plan crear(PlanRequest request){
        Plan nuevo = request.aEntidad();
        return planRepository.save(nuevo);
    }

    public Optional<Plan> actualizar(Long id, PlanRequest datos){
        Optional<Plan> encontrado = planRepository.findById(id);
        if(encontrado.isEmpty()){
            return Optional.empty();
        }

        Plan plan = encontrado.get();
        plan.setNombre(datos.nombre());
        plan.setDuracionMeses(datos.duracionMeses());
        plan.setPrecio(datos.precio());
        return Optional.of(planRepository.save(plan));
    }

    public boolean eliminar(Long id){
        if(!planRepository.existsById(id)){
            return false;
        }
        planRepository.deleteById(id);
        return true;
    }
}

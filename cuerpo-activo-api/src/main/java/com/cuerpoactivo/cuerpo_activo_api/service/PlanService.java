package com.cuerpoactivo.cuerpo_activo_api.service;


import com.cuerpoactivo.cuerpo_activo_api.model.Plan;
import com.cuerpoactivo.cuerpo_activo_api.repository.PlanRepository;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
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

    public Plan crear(Plan nuevo){
        nuevo.setId(null);
        return planRepository.save(nuevo);
    }

    public Optional<Plan> actualizar(Long id, Plan datos){
        Optional<Plan> encontrado = planRepository.findById(id);
        if(encontrado.isEmpty()){
            return Optional.empty();
        }

        Plan plan = encontrado.get();
        plan.setNombre(datos.getNombre());
        plan.setDuracionMeses(datos.getDuracionMeses());
        plan.setPrecio(datos.getPrecio());
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

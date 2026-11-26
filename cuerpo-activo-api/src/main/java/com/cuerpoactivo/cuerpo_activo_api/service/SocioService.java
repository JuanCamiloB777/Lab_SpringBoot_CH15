package com.cuerpoactivo.cuerpo_activo_api.service;

import com.cuerpoactivo.cuerpo_activo_api.dto.SocioRequest;
import com.cuerpoactivo.cuerpo_activo_api.exception.RecursoNoEncontradoException;
import com.cuerpoactivo.cuerpo_activo_api.exception.ReglaDeNegocioException;
import com.cuerpoactivo.cuerpo_activo_api.model.Plan;
import com.cuerpoactivo.cuerpo_activo_api.model.Socio;
import com.cuerpoactivo.cuerpo_activo_api.repository.PlanRepository;
import com.cuerpoactivo.cuerpo_activo_api.repository.SocioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SocioService {
    private final SocioRepository socioRepository;
    private final PlanRepository planRepository;

    public SocioService(SocioRepository socioRepository, PlanRepository planRepository){
        this.socioRepository = socioRepository;
        this.planRepository = planRepository;
    }

    public List<Socio> listar(){
        return socioRepository.findAll();
    }

    public Socio buscarPorId(Long id){
        Optional<Socio> encontrado = socioRepository.findById(id);
        if(encontrado.isEmpty()){
            throw new RecursoNoEncontradoException("No existe el socio con id " + id);
        }
        return encontrado.get();
    }

    public Socio crear(SocioRequest request){
        Plan plan = buscarPlan(request.planId());
        Socio socio = request.aEntidad(plan);
        return socioRepository.save(socio);
    }

    private Plan buscarPlan(Long planId){
        Optional<Plan> plan = planRepository.findById(planId);
        if(plan.isEmpty()){
            throw new ReglaDeNegocioException("No existe el plan con id " + planId);
        }
        return plan.get();
    }
}

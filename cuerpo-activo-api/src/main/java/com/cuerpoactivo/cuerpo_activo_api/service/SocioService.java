package com.cuerpoactivo.cuerpo_activo_api.service;

import com.cuerpoactivo.cuerpo_activo_api.dto.SocioRequest;
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

    public Optional<Socio> buscarPorId(Long id){
        return socioRepository.findById(id);
    }

    public Optional<Socio> crear(SocioRequest request){
        if(request.planId() == null){
            return Optional.empty();
        }

        Optional<Plan> plan = planRepository.findById(request.planId());
        if(plan.isEmpty()){
            return Optional.empty();
        }

        Socio socio = request.aEntidad(plan.get());
        return Optional.of(socioRepository.save(socio));
    }
}

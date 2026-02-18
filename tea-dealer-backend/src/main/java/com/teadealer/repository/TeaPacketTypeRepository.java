package com.teadealer.repository;

import com.teadealer.model.TeaPacketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeaPacketTypeRepository extends JpaRepository<TeaPacketType, Long> {
    List<TeaPacketType> findByActiveTrue();
    List<TeaPacketType> findByActiveTrueOrderByNameAsc();
}

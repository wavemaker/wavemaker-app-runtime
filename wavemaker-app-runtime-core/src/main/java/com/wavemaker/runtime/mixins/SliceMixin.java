package com.wavemaker.runtime.mixins;

import org.springframework.data.domain.Pageable;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * @author Dilip Kumar
 * @since 23/3/18
 */
public interface SliceMixin {

    @JsonIgnore
    Pageable getPageable();

}

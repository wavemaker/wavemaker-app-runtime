package com.wavemaker.runtime.mixins;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

/**
 * @author Dilip Kumar
 * @since 23/3/18
 */
public interface SliceMixin {

    @JsonIgnore
    Pageable getPageable();

    @JsonIgnoreProperties("descending")
    @JsonSerialize(as = Iterable.class)
    Sort getSort();

}

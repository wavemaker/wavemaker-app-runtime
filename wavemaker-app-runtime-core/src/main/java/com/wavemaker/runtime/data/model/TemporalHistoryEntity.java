package com.wavemaker.runtime.data.model;

import java.io.Serializable;

import javax.persistence.Transient;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/17
 */
public interface TemporalHistoryEntity<Parent> extends Serializable {

    @Transient
    Parent asParent();

}

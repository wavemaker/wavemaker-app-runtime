package com.wavemaker.runtime.service;

import java.util.List;

import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 2/11/16
 */
public interface QueryDesignService {

    List<ReturnProperty> extractMeta(String serviceId, RuntimeQuery query);

    DesignServiceResponse executeQuery(String serviceId, RuntimeQuery query);
}

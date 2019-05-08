/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 2/11/16
 */
public interface QueryDesignService {

    List<ReturnProperty> extractMeta(String serviceId, RuntimeQuery query);

    DesignServiceResponse testRunQuery(String serviceId, MultipartHttpServletRequest request, Pageable pageable);

    DesignServiceResponse testRunQuery(String serviceId, RuntimeQuery query, final Pageable pageable);

    Object executeQuery(String serviceId, RuntimeQuery query, final Pageable pageable);
}

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
package com.wavemaker.runtime.security.csrf;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

import com.wavemaker.commons.model.security.CSRFConfig;

/**
 * Created by kishorer on 7/7/16.
 */
public class WMHttpSessionCsrfTokenRepository extends AbstractCsrfTokenRepository implements InitializingBean {

    private CSRFConfig csrfConfig;
    private HttpSessionCsrfTokenRepository tokenRepository;

    public WMHttpSessionCsrfTokenRepository(HttpSessionCsrfTokenRepository tokenRepository) {
        super(tokenRepository);
        this.tokenRepository = tokenRepository;
    }

    public void setCsrfConfig(final CSRFConfig csrfConfig) {
        this.csrfConfig = csrfConfig;
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        updateRepositoryProperties();
    }

    private void updateRepositoryProperties() {
        if (csrfConfig != null) {
            String headerName = csrfConfig.getHeaderName();
            tokenRepository.setHeaderName(headerName);
        }
    }
}

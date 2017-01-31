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
package com.wavemaker.runtime.security.provider.saml.websso;


/**
 * Created by ArjunSahasranam on 10/11/16.
 */

import java.util.List;

import org.opensaml.common.SAMLException;
import org.opensaml.saml2.core.AudienceRestriction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.saml.websso.WebSSOProfileConsumerImpl;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;

public class WMWebSSOProfileConsumerImpl extends WebSSOProfileConsumerImpl {

    private static final Logger logger = LoggerFactory.getLogger(WMWebSSOProfileConsumerImpl.class);

    @Autowired
    private SAMLConfig samlConfig;

    @Override
    protected void verifyAudience(
            SAMLMessageContext context, List<AudienceRestriction> audienceRestrictions) throws SAMLException {
        final SAMLConfig.ValidateType validateType = samlConfig.getValidateType();
        if (SAMLConfig.ValidateType.RELAXED == validateType) {
            // No Comparison
            logger.debug("No Comaprison of audience restrictions with local entity endpoints");
            logger.debug("Audience Restrictions are {}", audienceRestrictions.toString());
            logger.debug("local entity endpoint is {}", context.getLocalEntityId());
        } else {
            super.verifyAudience(context, audienceRestrictions);
        }
    }
}


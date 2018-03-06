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

import org.apache.commons.lang3.StringUtils;
import org.opensaml.common.SAMLException;
import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.opensaml.ws.message.encoder.MessageEncodingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.saml.websso.SingleLogoutProfileImpl;
import org.springframework.security.saml.websso.WebSSOProfileOptions;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;

/**
 * Created by ArjunSahasranam on 25/11/16.
 */
public class WMSingleLogoutProfileImpl extends SingleLogoutProfileImpl {

    private static final Logger logger = LoggerFactory.getLogger(WMSingleLogoutProfileImpl.class);

    @Autowired
    private SAMLConfig samlConfig;

    @Autowired
    private WebSSOProfileOptions webSSOProfileOptions;

    @Override
    public void sendLogoutRequest(SAMLMessageContext context, SAMLCredential credential) throws SAMLException, MetadataProviderException, MessageEncodingException {
        if (SAMLConfig.ValidateType.RELAXED == samlConfig.getValidateType()) {
            // setting appruntimePath only in the case of DEV mode.
            String relayState = webSSOProfileOptions.getRelayState();
            logger.debug("Relay state from WebSSOProfileOptions is {}", relayState);
            if (StringUtils.isNotBlank(relayState)) {
                context.setRelayState(relayState);
            }
        }
        super.sendLogoutRequest(context, credential);
    }

}

package com.wavemaker.runtime.security.provider.saml.websso;

import org.apache.commons.lang3.StringUtils;
import org.joda.time.DateTime;
import org.opensaml.common.SAMLException;
import org.opensaml.common.SAMLObject;
import org.opensaml.saml2.core.AuthnStatement;
import org.opensaml.saml2.core.Issuer;
import org.opensaml.saml2.core.LogoutRequest;
import org.opensaml.saml2.core.NameID;
import org.opensaml.saml2.core.SessionIndex;
import org.opensaml.saml2.core.StatusCode;
import org.opensaml.saml2.metadata.Endpoint;
import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.opensaml.ws.message.encoder.MessageEncodingException;
import org.opensaml.xml.encryption.DecryptionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.security.saml.SAMLStatusException;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.saml.websso.SingleLogoutProfileImpl;
import org.springframework.security.saml.websso.WebSSOProfileOptions;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;

import static org.springframework.security.saml.util.SAMLUtil.isDateTimeSkewValid;

/**
 * Created by ArjunSahasranam on 25/11/16.
 */
public class WMSingleLogoutProfileImpl extends SingleLogoutProfileImpl {

    private static final Logger logger = LoggerFactory.getLogger(WMSingleLogoutProfileImpl.class);

    @Autowired
    private SAMLConfig samlConfig;

    @Autowired
    private WebSSOProfileOptions webSSOProfileOptions;

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

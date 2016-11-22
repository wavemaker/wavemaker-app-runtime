package com.wavemaker.runtime.security.provider.saml.websso;

import java.util.List;

import org.opensaml.common.SAMLException;
import org.opensaml.saml2.core.Audience;
import org.opensaml.saml2.core.AudienceRestriction;
import org.opensaml.saml2.metadata.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.saml.websso.WebSSOProfileConsumerImpl;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;
import com.wavemaker.runtime.security.provider.saml.util.SAMLUtil;

/**
 * Created by ArjunSahasranam on 10/11/16.
 */
public class WMWebSSOProfileConsumerImpl extends WebSSOProfileConsumerImpl {

    @Autowired
    private SAMLConfig samlConfig;

    @Override
    protected void verifyEndpoint(final Endpoint endpoint, final String destination) throws SAMLException {
        final SAMLConfig.ValidateType validateType = samlConfig.getValidateType();
        if (SAMLConfig.ValidateType.RELAXED == validateType) {
            if (destination != null) {
                if (SAMLUtil.relaxedCompareUrls(destination, endpoint.getLocation(), validateType)) {
                    // Expected
                } else if (SAMLUtil.relaxedCompareUrls(destination, endpoint.getResponseLocation(), validateType)) {
                    // Expected
                } else {
                    throw new SAMLException(
                            "Intended destination " + destination + " doesn't match any of the endpoint URLs on endpoint " + endpoint
                                    .getLocation() + " for profile " + getProfileIdentifier());
                }
            }
            return;
        } else super.verifyEndpoint(endpoint, destination);
    }

    @Override
    protected void verifyAudience(
            SAMLMessageContext context, List<AudienceRestriction> audienceRestrictions) throws SAMLException {
        final SAMLConfig.ValidateType validateType = samlConfig.getValidateType();
        if (SAMLConfig.ValidateType.RELAXED == validateType) {
            // Multiple AudienceRestrictions form a logical "AND" (saml-core, 922-925)
            audience:
            for (AudienceRestriction rest : audienceRestrictions) {
                if (rest.getAudiences().size() == 0) {
                    throw new SAMLException("No audit audience specified for the assertion");
                }
                for (Audience aud : rest.getAudiences()) {
                    // Multiple Audiences within one AudienceRestriction form a logical "OR" (saml-core, 922-925)
                    if (SAMLUtil.relaxedCompareUrls(context.getLocalEntityId(), aud.getAudienceURI(), validateType)) {
                        continue audience;
                    }
                }
                throw new SAMLException("Local entity is not the intended audience of the assertion in at least " +
                        "one AudienceRestriction");
            }
        } else super.verifyAudience(context, audienceRestrictions);
    }
}

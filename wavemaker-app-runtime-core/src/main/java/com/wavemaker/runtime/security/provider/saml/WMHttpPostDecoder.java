package com.wavemaker.runtime.security.provider.saml;

import org.opensaml.saml2.binding.decoding.HTTPPostDecoder;
import org.opensaml.ws.message.decoder.MessageDecodingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.wavemaker.runtime.security.provider.saml.util.SAMLUtil;

/**
 * Created by ArjunSahasranam on 10/11/16.
 */
public class WMHttpPostDecoder extends HTTPPostDecoder {

    @Autowired
    private SAMLConfig samlConfig;

    @Override
    protected boolean compareEndpointURIs(String messageDestination, String receiverEndpoint) throws MessageDecodingException {
        if (SAMLConfig.ValidateType.RELAXED == samlConfig.getValidateType()) {
            return SAMLUtil.relaxedCompareUrls(messageDestination, receiverEndpoint,samlConfig.getValidateType());
        } else return super.compareEndpointURIs(messageDestination, receiverEndpoint);
    }

}

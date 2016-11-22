package com.wavemaker.runtime.security.provider.saml.util;

import java.net.MalformedURLException;
import java.net.URL;

import org.apache.commons.lang3.StringUtils;
import org.opensaml.common.SAMLException;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;

/**
 * This class does url comparison by ignoring the tenantId.
 *
 * Created by ArjunSahasranam on 10/11/16.
 */
public class SAMLUtil {

    public static boolean relaxedCompareUrls(
            String messageDestination, String receiverEndpoint, SAMLConfig.ValidateType validateType) {
        if (SAMLConfig.ValidateType.RELAXED == validateType) {
            URL messageDestinationUrl = getUrl(messageDestination);
            URL receiverEndpointUrl = getUrl(receiverEndpoint);
            boolean ret = (messageDestinationUrl.getPort() == receiverEndpointUrl.getPort()) &&
                    (messageDestinationUrl.getHost().equals(receiverEndpointUrl.getHost())) &&
                    (messageDestinationUrl.getProtocol().equals(receiverEndpointUrl.getProtocol()));

            ret = ret && getPathByTenantIdIgnore(messageDestinationUrl.getPath()).equals(getPathByTenantIdIgnore(
                    receiverEndpointUrl.getPath()));
            return ret;
        } else if (SAMLConfig.ValidateType.STRICT == validateType) {
            return messageDestination.equals(receiverEndpoint);
        } else return false;
    }

    private static URL getUrl(String url) {
        try {
            return new URL(url);
        } catch (MalformedURLException e) {
            new SAMLException("InvalidUrl endpoint url " + url);

        }
        return null;
    }

    private static String getPathByTenantIdIgnore(String path) {
        final int beginIndex = StringUtils.indexOf(path, "/", 1);
        if (beginIndex != -1)
            return path.substring(beginIndex);
        return null;
    }
}

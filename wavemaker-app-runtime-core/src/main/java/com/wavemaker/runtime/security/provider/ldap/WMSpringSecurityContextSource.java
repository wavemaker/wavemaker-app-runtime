package com.wavemaker.runtime.security.provider.ldap;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.ldap.DefaultSpringSecurityContextSource;

/**
 * @author Kishore Routhu on 5/1/18 2:29 PM.
 */
public class WMSpringSecurityContextSource extends DefaultSpringSecurityContextSource {

    private static final String URL_SEPARATOR = ";";

    public WMSpringSecurityContextSource(String providerUrl) {
        this(Arrays.asList(providerUrl.split(URL_SEPARATOR)), StringUtils.EMPTY);
    }

    public WMSpringSecurityContextSource(List<String> urls, String baseDn) {
        super(urls, baseDn);
    }
}

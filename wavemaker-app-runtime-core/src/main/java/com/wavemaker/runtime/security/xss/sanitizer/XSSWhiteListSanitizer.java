package com.wavemaker.runtime.security.xss.sanitizer;

import java.io.InputStream;
import javax.servlet.ServletContext;

import org.apache.commons.lang3.StringUtils;
import org.owasp.validator.html.AntiSamy;
import org.owasp.validator.html.CleanResults;
import org.owasp.validator.html.Policy;
import org.owasp.validator.html.PolicyException;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.security.csrf.SecurityConfigConstants;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.classloader.ClassLoaderUtils;
import com.wavemaker.commons.util.IOUtils;

/**
 * Created by kishorer on 6/7/16.
 */
public class XSSWhiteListSanitizer implements XSSSanitizer {

    private static final String POLICIES_LOCATION = "/WEB-INF/";

    private AntiSamy antiSamy;

    public XSSWhiteListSanitizer(String policyFile) {
        Policy policy = buildPolicy(policyFile);
        antiSamy = new AntiSamy(policy);
    }

    @Override
    public String sanitizeRequestData(String data) {
        if (data == null) {
            return data;
        }
        try {
            CleanResults cleanResults = antiSamy.scan(data);
            return cleanResults.getCleanHTML();
        } catch (Exception e) {
            throw new WMRuntimeException(e);
        }
    }

    private Policy buildPolicy(String policyFile) {
        InputStream resourceStream = null;
        try {
            ServletContext servletContext = WMAppContext.getInstance().getContext();
            resourceStream = servletContext.getResourceAsStream(POLICIES_LOCATION + policyFile);
            if (resourceStream == null) {
                resourceStream = ClassLoaderUtils.getResourceAsStream(policyFile);
            }
            return Policy.getInstance(resourceStream);
        } catch (PolicyException e) {
            throw new WMRuntimeException(e);
        } finally {
            IOUtils.closeSilently(resourceStream);
        }
    }
}

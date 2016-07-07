package com.wavemaker.runtime.security.xss.sanitizer;

import javax.servlet.ServletContext;

import org.owasp.validator.html.AntiSamy;
import org.owasp.validator.html.CleanResults;
import org.owasp.validator.html.Policy;
import org.owasp.validator.html.PolicyException;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.studio.common.WMRuntimeException;

/**
 * Created by kishorer on 6/7/16.
 */
public class XSSWhiteListSanitizer implements XSSSanitizer {

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
        try {
            ServletContext servletContext = WMAppContext.getInstance().getContext();
            servletContext.getResourceAsStream(policyFile);
            return Policy.getInstance(servletContext.getResourceAsStream(policyFile));
        } catch (PolicyException e) {
            throw new WMRuntimeException(e);
        }
    }
}

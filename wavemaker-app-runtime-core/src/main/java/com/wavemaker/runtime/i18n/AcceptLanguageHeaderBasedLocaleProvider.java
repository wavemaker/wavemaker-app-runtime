package com.wavemaker.runtime.i18n;

import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.lang3.StringUtils;

import com.wavemaker.commons.i18n.DefaultLocaleProvider;
import com.wavemaker.runtime.web.filter.WMRequestFilter;

/**
 * @author Uday Shankar
 */
public class AcceptLanguageHeaderBasedLocaleProvider extends DefaultLocaleProvider {
    
    @Override
    public String[] getLocales() {
        HttpServletRequest httpServletRequest = WMRequestFilter.getCurrentThreadHttpServletRequest();
        if (httpServletRequest != null) {
            String acceptLanguageHeader = httpServletRequest.getHeader("Accept-Language");
            if (StringUtils.isNotBlank(acceptLanguageHeader)) {
                Enumeration<Locale> locales = httpServletRequest.getLocales();
                List<String> localesList = new ArrayList<>();
                while (locales.hasMoreElements()) {
                    localesList.add(locales.nextElement().toLanguageTag());
                }
            }
        }
        return super.getLocales();
    }
}

package com.wavemaker.runtime.i18n;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;

import com.wavemaker.commons.WMError;
import com.wavemaker.commons.i18n.FinalLocaleData;
import com.wavemaker.commons.i18n.LocaleMessageProviderImpl;
import com.wavemaker.commons.json.JSONUtils;

/**
 * Created by srujant on 3/9/18.
 */
public class WMAppLocaleMessageProviderImpl extends LocaleMessageProviderImpl {

    public WMAppLocaleMessageProviderImpl(List<String> locationPatterns, ResourcePatternResolver resourcePatternResolver) {
        super(locationPatterns, resourcePatternResolver);
    }

    @Override
    protected Map<String, String> loadLocaleMessages(String locale) {
        Map<String, String> localeMessages = super.loadLocaleMessages(locale);
        Resource[] resources = getResources("/resources/i18n/", locale + ".json");
        for (Resource resource : resources) {
            try {
                FinalLocaleData localeData = JSONUtils.toObject(resource.getInputStream(), FinalLocaleData.class);
                localeMessages.putAll(localeData.getMessages());
            } catch (IOException e) {
                throw new WMError("Failed to read locale resources for locale " + locale, e);
            }
        }
        return localeMessages;
    }
}

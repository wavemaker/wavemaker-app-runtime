package com.wavemaker.runtime.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Enumeration;
import java.util.Locale;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.commons.ResourceNotFoundException;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.PropertiesFileUtils;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.commons.validations.DbValidationsConstants;
import com.wavemaker.runtime.app.AppFileSystem;
import com.wavemaker.runtime.data.model.DesignServiceResponse;
import com.wavemaker.runtime.data.model.procedures.RuntimeProcedure;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.util.MultipartQueryUtils;

/**
 * Created by Kishore Routhu on 21/6/17 3:00 PM.
 */
public class AppRuntimeServiceImpl implements AppRuntimeService {

    private String applicationType = null;
    private static final String DEFAULT_LANGUAGE = "en";
    private static final String APP_PROPERTIES = ".wmproject.properties";
    private static final String RUNTIME_I18N_FILE_PATTERN = "/WEB-INF/i18n/${lang}.json";

    private static final Logger LOGGER = LoggerFactory.getLogger(AppRuntimeServiceImpl.class);

    @Autowired
    private QueryDesignService queryDesignService;

    @Autowired
    private ProcedureDesignService procedureDesignService;

    @Autowired
    private AppFileSystem appFileSystem;

    public String getApplicationType() {
        if (applicationType == null) {
            synchronized (this) {
                if (applicationType == null) {
                    InputStream inputStream = appFileSystem.getClasspathResourceStream(APP_PROPERTIES);
                    Properties properties = PropertiesFileUtils.loadFromXml(inputStream);
                    applicationType = properties.getProperty("type");
                }
            }
        }
        return applicationType;
    }

    @Override
    public DesignServiceResponse testRunQuery(String serviceId, MultipartHttpServletRequest request, Pageable pageable) {
        RuntimeQuery query = MultipartQueryUtils.readContent(request, RuntimeQuery.class);
        MultipartQueryUtils.setMultiparts(query.getParameters(), request.getMultiFileMap());
        return queryDesignService.testRunQuery(serviceId, query, pageable);
    }

    @Override
    public DesignServiceResponse testRunProcedure(String serviceId, RuntimeProcedure procedure) {
        return procedureDesignService.testRunProcedure(serviceId, procedure);
    }

    @Override
    public Object executeQuery(String serviceId, RuntimeQuery query, Pageable pageable) {
        return queryDesignService.executeQuery(serviceId, query, pageable);
    }

    @Override
    public void getLocaleMessages(String locale, HttpServletResponse response) {
        InputStream inputStream = null;
        OutputStream outputStream = null;
        try {
            inputStream = getLocaleResourceStream(locale);
            outputStream = response.getOutputStream();
            WMIOUtils.copy(inputStream, outputStream);
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        } finally {
            WMIOUtils.closeSilently(inputStream);
        }
    }

    @Override
    public InputStream getValidations(HttpServletResponse httpServletResponse) {
        return appFileSystem.getWebappResource("WEB-INF/" + DbValidationsConstants.DB_VALIDATIONS_JSON_FILE);
    }


    @Override
    public void getLocaleMessages(HttpServletRequest request, HttpServletResponse response) {
        InputStream inputStream = null;
        OutputStream outputStream = null;
        try {
            inputStream = getPreferLocaleResourceStream(request.getLocales());
            outputStream = response.getOutputStream();
            WMIOUtils.copy(inputStream, outputStream);
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        } finally {
            WMIOUtils.closeSilently(inputStream);
        }
    }

    private InputStream getPreferLocaleResourceStream(Enumeration locales) {

        while (locales.hasMoreElements()) {
            try {
                Locale locale = (Locale) locales.nextElement();
                return appFileSystem.getWebappResource(getLocaleResourcePath(locale.getLanguage()));
            } catch (ResourceNotFoundException rnfe) {
                //Ignore the exception as to find for another language in the order
                LOGGER.debug(rnfe.getMessage());
            }
        }

        return appFileSystem.getWebappResource(getLocaleResourcePath(DEFAULT_LANGUAGE));
    }

    private InputStream getLocaleResourceStream(String locale) {
        try {
            return appFileSystem.getWebappResource(getLocaleResourcePath(locale));
        } catch (ResourceNotFoundException rnfe) {
            //Ignore the exception as to find for another language in the order
            LOGGER.debug(rnfe.getMessage());
        }
        return appFileSystem.getWebappResource(getLocaleResourcePath(DEFAULT_LANGUAGE));
    }

    private String getLocaleResourcePath(String locale) {
        return RUNTIME_I18N_FILE_PATTERN.replace("${lang}", locale);
    }
}

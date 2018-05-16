package com.wavemaker.runtime.data.export;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.commons.WMRuntimeException;
import freemarker.cache.StringTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateExceptionHandler;

public class ExpressionFieldValueProvider implements FieldValueProvider {

    private final Template template;
    private static final Logger logger = LoggerFactory.getLogger(ExpressionFieldValueProvider.class);

    public ExpressionFieldValueProvider(String expression) {
        Configuration configuration = new Configuration(Configuration.VERSION_2_3_23);

        // Where do we load the templates from:
        StringTemplateLoader templateLoader = new StringTemplateLoader();
        templateLoader.putTemplate("expression", expression);

        configuration.setTemplateLoader(templateLoader);

        // Some other recommended settings:
        configuration.setDefaultEncoding("UTF-8");
        configuration.setLocale(Locale.US);
        configuration.setAPIBuiltinEnabled(true);

        configuration.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);

        try {
            template = configuration.getTemplate("expression");
        } catch (IOException e) { // it won't come.
            throw new WMRuntimeException(e);
        }
    }

    @Override
    public Object getValue(Object object) {
        try {
            StringWriter writer = new StringWriter();
            template.process(object, writer);
            return writer.toString();
        } catch (Exception e) {
            logger.warn("Invalid expression: {}. Refer documentation for more information.", object);
            return "";
        }
    }
}

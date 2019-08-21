package com.wavemaker.runtime.adaptivecard;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.servlet.ServletContext;

import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.wrapper.RawStringWrapper;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;

public class AdaptiveCardResolverServiceImpl implements AdaptiveCardResolverService {


    private static final String VARIABLES = "Variables";
    private static final String PAGE_PARAMS = "pageParams";
    private static final String FILE_SEPERATOR = "/";

    @Autowired
    private ServletContext servletContext;

    @Autowired
    private AdaptiveCardRecursiveEvaluator adaptiveCardRecursiveEvaluator;

    private Configuration cfg;

    AdaptiveCardResolverServiceImpl() {
        cfg = new Configuration(Configuration.VERSION_2_3_28);
        cfg.setDefaultEncoding("UTF-8");
        cfg.setLocale(Locale.US);
        cfg.setAPIBuiltinEnabled(true);
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
    }

    @Override
    public String resolveCard(String cardName, Map<String, String> params) {
        File variableJson = new File(servletContext.getRealPath("/pages/" + cardName + FILE_SEPERATOR + cardName + ".variables.json"));
        try (FileInputStream fileInputStream = new FileInputStream(variableJson)) {
            Map<String, Object> variables = JSONUtils.toObject(fileInputStream, new TypeReference<Map<String, Object>>() {
            });
            variables = adaptiveCardRecursiveEvaluator.evaluate(variables, params);
            cfg.setDirectoryForTemplateLoading(new File(servletContext.getRealPath("/pages/")));
            Template template = cfg.getTemplate(FILE_SEPERATOR + cardName + FILE_SEPERATOR + cardName + ".card.ftl");
            Map<String, Object> modelInput = new HashMap<>();
            modelInput.put(VARIABLES, variables);
            modelInput.put(PAGE_PARAMS, params);

            StringWriter writer = new StringWriter();

            template.process(modelInput, writer);

            return new RawStringWrapper(writer.toString()).getValue();
        } catch (IOException | TemplateException e) {
            throw new RuntimeException("failed to generate adaptiveCard", e);
        }
    }
}

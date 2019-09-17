package com.wavemaker.runtime.adaptivecard;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Map;

import com.wavemaker.commons.WMRuntimeException;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;

public class ExpressionEvaluator {

    private ExpressionEvaluator() {

    }

    public static String evalExpression(String expression, Map<String, Object> modelInput) {
        if (expression.contains("bind:")) {
            expression = expression.replaceAll("bind:", "");
            //check this..
            expression = expression.replaceAll("\\$i", "0");
            String templateStr = "${" + expression + "}";
            try {
                Template template = new Template("name", new StringReader(templateStr), new Configuration(Configuration.VERSION_2_3_28));
                StringWriter writer = new StringWriter();
                template.process(modelInput, writer);
                return writer.toString();
            } catch (IOException | TemplateException e) {
                throw new WMRuntimeException("failed while evaluating bind expression", e);
            }
        }
        return expression;
    }

}

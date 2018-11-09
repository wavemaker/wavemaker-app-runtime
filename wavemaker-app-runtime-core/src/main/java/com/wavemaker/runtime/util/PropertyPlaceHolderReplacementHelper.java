package com.wavemaker.runtime.util;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;

import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;

import com.wavemaker.commons.util.PatternMatchingReplaceReader;

/**
 * Created by srujant on 10/10/18.
 */
public class PropertyPlaceHolderReplacementHelper implements EnvironmentAware {

    private Environment environment;

    public Reader getPropertyReplaceReader(Reader reader) {
        return new PatternMatchingReplaceReader(reader, "${", "}", key -> environment.getProperty(key));
    }

    public Reader getPropertyReplaceReader(InputStream inputStream) {
        InputStreamReader inputStreamReader = new InputStreamReader(inputStream, Charset.forName("UTF-8"));
        return getPropertyReplaceReader(inputStreamReader);
    }

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }
}

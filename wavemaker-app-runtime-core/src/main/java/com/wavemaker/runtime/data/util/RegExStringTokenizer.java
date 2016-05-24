package com.wavemaker.runtime.data.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 24/5/16
 */
public class RegExStringTokenizer {

    private final List<String> tokens;
    private int index = 0;

    public RegExStringTokenizer(String input, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(input);
        this.tokens = new ArrayList<>();
        while (matcher.find()) {
            tokens.add(matcher.group());
        }

    }

    public boolean hasNext() {
        return index < tokens.size();
    }

    public String nextToken() {
        return tokens.get(index++);
    }
}

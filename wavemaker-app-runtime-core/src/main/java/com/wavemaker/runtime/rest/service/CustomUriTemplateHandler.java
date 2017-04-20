package com.wavemaker.runtime.rest.service;

import java.util.List;

import org.springframework.web.util.DefaultUriTemplateHandler;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Created by srujant on 19/4/17.
 */
public class CustomUriTemplateHandler extends DefaultUriTemplateHandler {
    @Override
    protected UriComponentsBuilder initUriComponentsBuilder(String uriTemplate) {
        UriComponentsBuilder builder = CustomUriComponentsBuilder.fromUriString(uriTemplate);
        if (shouldParsePath()) {
            List<String> pathSegments = builder.build().getPathSegments();
            builder.replacePath(null);
            for (String pathSegment : pathSegments) {
                builder.pathSegment(pathSegment);
            }
        }
        return builder;
    }

}

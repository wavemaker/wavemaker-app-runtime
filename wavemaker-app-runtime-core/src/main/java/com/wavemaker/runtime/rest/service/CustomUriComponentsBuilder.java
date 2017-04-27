package com.wavemaker.runtime.rest.service;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import com.wavemaker.commons.CommonConstants;

/**
 * Created by srujant on 19/4/17.
 */
public class CustomUriComponentsBuilder extends UriComponentsBuilder {

    private static final Logger logger = LoggerFactory.getLogger(CustomUriComponentsBuilder.class);

    private static final String SCHEME_PATTERN = "([^:/?#]+):";

    private static final String USERINFO_PATTERN = "([^@\\[/?#]*)";

    private static final String HOST_IPV4_PATTERN = "[^\\[/?#:]*";

    private static final String HOST_IPV6_PATTERN = "\\[[\\p{XDigit}\\:\\.]*[%\\p{Alnum}]*\\]";

    private static final String HOST_PATTERN = "(" + HOST_IPV6_PATTERN + "|" + HOST_IPV4_PATTERN + ")";

    private static final String PORT_PATTERN = "(\\d*(?:\\{[^/]+?\\})?)";

    private static final String PATH_PATTERN = "([^?#]*)";

    private static final String QUERY_PATTERN = "([^#]*)";

    private static final String LAST_PATTERN = "(.*)";

    private static final Pattern URI_PATTERN = Pattern.compile(
            "^(" + SCHEME_PATTERN + ")?" + "(//(" + USERINFO_PATTERN + "@)?" + HOST_PATTERN + "(:" + PORT_PATTERN +
                    ")?" + ")?" + PATH_PATTERN + "(\\?" + QUERY_PATTERN + ")?" + "(#" + LAST_PATTERN + ")?");

    private static final Pattern QUERY_PARAM_PATTERN = Pattern.compile("([^&=]+)(=?)([^&]+)?");

    //TODO find a better way without duplicating the code
    public static UriComponentsBuilder fromUriString(String uri) {
        Assert.notNull(uri, "URI must not be null");
        Matcher matcher = URI_PATTERN.matcher(uri);
        if (matcher.matches()) {
            UriComponentsBuilder builder = new CustomUriComponentsBuilder();
            String scheme = matcher.group(2);
            String userInfo = matcher.group(5);
            String host = matcher.group(6);
            String port = matcher.group(8);
            String path = matcher.group(9);
            String query = matcher.group(11);
            String fragment = matcher.group(13);
            boolean opaque = false;
            if (StringUtils.hasLength(scheme)) {
                String rest = uri.substring(scheme.length());
                if (!rest.startsWith(":/")) {
                    opaque = true;
                }
            }
            builder.scheme(scheme);
            if (opaque) {
                String ssp = uri.substring(scheme.length()).substring(1);
                if (StringUtils.hasLength(fragment)) {
                    ssp = ssp.substring(0, ssp.length() - (fragment.length() + 1));
                }
                builder.schemeSpecificPart(ssp);
            } else {
                builder.userInfo(userInfo);
                builder.host(host);
                if (StringUtils.hasLength(port)) {
                    builder.port(port);
                }
                builder.path(path);
                builder.query(query);
            }
            if (StringUtils.hasText(fragment)) {
                builder.fragment(fragment);
            }
            return builder;
        } else {
            throw new IllegalArgumentException("[" + uri + "] is not a valid URI");
        }
    }

    @Override
    public UriComponentsBuilder path(String path) {
        try {
            if (path != null) {
                path = URLDecoder.decode(path, CommonConstants.UTF8);
            }
            replacePath(path);
        } catch (UnsupportedEncodingException e) {
            logger.error("Failed to decode path", path);
        }


        return this;
    }


    @Override
    public UriComponentsBuilder query(String query) {
        if (query != null) {
            Matcher matcher = QUERY_PARAM_PATTERN.matcher(query);
            while (matcher.find()) {
                String name = matcher.group(1);
                String eq = matcher.group(2);
                String value = matcher.group(3);
                try {
                    if (value != null) {
                        value = URLDecoder.decode(value, CommonConstants.UTF8);
                    }
                } catch (UnsupportedEncodingException e) {
                    logger.error("Failed to decode queryParams {}", query);
                }
                queryParam(name, (value != null ? value : (StringUtils.hasLength(eq) ? "" : null)));
            }
        } else {
            replaceQueryParams(null);
        }

        // TODO  Doesn't work with opaque urls.Find a better way to set ssp value.
        //        schemeSpecificPart(null);
        return this;
    }

}

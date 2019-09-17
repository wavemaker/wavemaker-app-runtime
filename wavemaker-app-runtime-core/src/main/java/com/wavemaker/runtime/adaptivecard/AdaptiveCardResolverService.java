package com.wavemaker.runtime.adaptivecard;

import java.util.Map;

import javax.servlet.http.HttpServletRequest;

public interface AdaptiveCardResolverService {

    String resolveCard(HttpServletRequest httpServletRequest, String cardName, Map<String, String> params);
}

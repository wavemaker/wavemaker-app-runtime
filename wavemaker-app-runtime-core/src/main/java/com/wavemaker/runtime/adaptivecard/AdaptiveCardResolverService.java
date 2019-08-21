package com.wavemaker.runtime.adaptivecard;

import java.util.Map;

public interface AdaptiveCardResolverService {

    String resolveCard(String cardName, Map<String, String> params);
}

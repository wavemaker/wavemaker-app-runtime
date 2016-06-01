package com.wavemaker.runtime.security.token.exception;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 1/6/16
 */
public class TokenGenerationException extends RuntimeException {

    public TokenGenerationException() {
        super();
    }

    public TokenGenerationException(String message) {
        super(message);
    }

    public TokenGenerationException(String message, Exception e) {
        super(message, e);
    }
}

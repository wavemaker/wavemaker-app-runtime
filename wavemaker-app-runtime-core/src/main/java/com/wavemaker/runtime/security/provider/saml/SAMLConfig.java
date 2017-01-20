package com.wavemaker.runtime.security.provider.saml;

/**
 * Created by ArjunSahasranam on 23/11/16.
 */
public class SAMLConfig {
    private ValidateType validateType;

    public ValidateType getValidateType() {
        return validateType;
    }

    public void setValidateType(final ValidateType validateType) {
        this.validateType = validateType;
    }

    public enum ValidateType {
        STRICT,  // String.equals()
        RELAXED, // DEV MODE 
        NONE // none
    }
}

package com.wavemaker.runtime.data.export;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/12/18
 */
public class ExportField {

    private String displayName;
    private FieldValueProvider valueProvider;

    public ExportField(final String displayName, final FieldValueProvider valueProvider) {
        this.displayName = displayName;
        this.valueProvider = valueProvider;
    }

    public String getDisplayName() {
        return displayName;
    }

    public FieldValueProvider getValueProvider() {
        return valueProvider;
    }
}

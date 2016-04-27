package com.wavemaker.runtime.data.dialect;

import org.hibernate.dialect.HSQLDialect;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 26/4/16
 */
public class WMHSQLDialect extends HSQLDialect {

    public static final char EMPTY_CHAR = ' ';

    /**
     * The character specific to this dialect used to begin a quoted identifier.
     *
     * @return The dialect's specific open quote character.
     */
    public char openQuote() {
        return EMPTY_CHAR;
    }

    /**
     * The character specific to this dialect used to close a quoted identifier.
     *
     * @return The dialect's specific close quote character.
     */
    public char closeQuote() {
        return EMPTY_CHAR;
    }

}

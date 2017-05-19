package com.wavemaker.runtime.data.export;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 22/5/17
 */
public interface QueryExtractor {

    boolean hasNext() throws Exception;

    boolean isFirstRow();

    Object getCurrentRow() throws Exception;

}

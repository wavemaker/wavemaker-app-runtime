package com.wavemaker.runtime.data.export.hqlquery;

import org.hibernate.ScrollableResults;

import com.wavemaker.runtime.data.export.QueryExtractor;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 22/5/17
 */
public class HqlQueryExtractor implements QueryExtractor {

    public ScrollableResults results;

    public HqlQueryExtractor(final ScrollableResults results) {
        this.results = results;
    }

    @Override
    public boolean hasNext() throws Exception {
        return results.next();
    }

    @Override
    public boolean isFirstRow() {
        return results.isFirst();
    }

    @Override
    public Object getCurrentRow() throws Exception {
        return results.get(0);
    }
}

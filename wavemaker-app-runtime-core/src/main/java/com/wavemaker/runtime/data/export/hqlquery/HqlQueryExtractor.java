package com.wavemaker.runtime.data.export.hqlquery;

import org.hibernate.ScrollableResults;

import com.wavemaker.runtime.data.export.QueryExtractor;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 22/5/17
 */
public class HqlQueryExtractor implements QueryExtractor {

    private ScrollableResults results;
    private int currentIndex;


    public HqlQueryExtractor(final ScrollableResults results) {
        this.results = results;
    }

    @Override
    public boolean next() throws Exception {
        final boolean hasNext = results.next();
        this.currentIndex++;
        return hasNext;
    }

    @Override
    public boolean isFirstRow() {
        //since isFirst() or getRow() methods in org.hibernate.ScrollableResults are not supported in few DBs.
        return currentIndex == 1;
    }

    @Override
    public Object getCurrentRow() throws Exception {
        return results.get(0);
    }
}

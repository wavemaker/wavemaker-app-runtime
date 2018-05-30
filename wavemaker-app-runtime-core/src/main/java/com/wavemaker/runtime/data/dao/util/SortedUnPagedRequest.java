package com.wavemaker.runtime.data.dao.util;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * @author Dilip Kumar
 * @since 16/5/18
 */
public class SortedUnPagedRequest implements Pageable {

    private final int page;
    private final int size;
    private final Sort sort;

    public SortedUnPagedRequest(int page, int size) {
        this(page, size, Sort.unsorted());
    }

    public SortedUnPagedRequest(final int page, final int size, final Sort sort) {
        this.page = page;
        this.size = size;
        this.sort = sort;
    }

    public int getPageNumber() {
        return page;
    }

    public int getPageSize() {
        return size;
    }

    public long getOffset() {
        return page * (long) size;
    }

    @Override
    public Sort getSort() {
        return sort;
    }

    @Override
    public Pageable next() {
        return new SortedUnPagedRequest(getPageNumber() + 1, getPageSize(), getSort());
    }

    public Pageable previousOrFirst() {
        return hasPrevious() ? previous() : first();
    }

    @Override
    public Pageable first() {
        return new SortedUnPagedRequest(0, getPageSize(), getSort());
    }

    public boolean hasPrevious() {
        return page > 0;
    }

    public SortedUnPagedRequest previous() {
        return getPageNumber() == 0 ? this : new SortedUnPagedRequest(getPageNumber() - 1, getPageSize(), getSort());
    }
}


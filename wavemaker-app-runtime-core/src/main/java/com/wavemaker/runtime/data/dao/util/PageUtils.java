package com.wavemaker.runtime.data.dao.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * @author Dilip Kumar
 * @since 11/4/18
 */
public abstract class PageUtils {

    private static final int DEFAULT_PAGE_NUMBER = 0;
    private static final int DEFAULT_PAGE_SIZE = 20;

    public static Pageable defaultIfNull(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE);
        } else if (pageable.getSort() == null) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.unsorted());
        } else {
            return pageable;
        }
    }
}

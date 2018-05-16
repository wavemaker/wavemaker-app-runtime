package com.wavemaker.runtime.data.dao.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * @author Dilip Kumar
 * @since 11/4/18
 */
public interface PageUtils {

    int DEFAULT_PAGE_NUMBER = 0;
    int DEFAULT_PAGE_SIZE = 20;

    static Pageable defaultIfNull(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE);
        } else if (pageable.getSort() == null) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.unsorted());
        } else {
            return pageable;
        }
    }

    static Pageable overrideExportSize(final Pageable pageable, final Integer exportSize) {
        final Pageable validPageable;
        if (exportSize == null || exportSize <= 0) {
            if (pageable == null) {
                validPageable = new SortedUnPagedRequest(0, 0);
            } else {
                validPageable = new SortedUnPagedRequest(0, 0, pageable.getSort());
            }
        } else {
            if (pageable == null) {
                validPageable = PageRequest.of(0, exportSize);
            } else {
                validPageable = PageRequest.of(pageable.getPageNumber(), exportSize, pageable.getSort());
            }
        }
        return validPageable;
    }
}
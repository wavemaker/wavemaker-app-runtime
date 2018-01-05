package com.wavemaker.runtime.data.util;

import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/17
 */
public class Mappers {

    public static <E, R> Page<R> map(Page<E> page, Pageable pageable, Function<E, R> mappingFunction) {
        final List<R> newList = map(page.getContent(), mappingFunction);
        return new PageImpl<>(newList, pageable, page.getTotalElements());
    }

    public static <E, R> List<R> map(List<E> list, Function<E, R> mappingFunction) {
        if (list != null && !list.isEmpty()) {
            return list.stream()
                    .map(mappingFunction)
                    .collect(Collectors.toList());
        } else {
            return Collections.emptyList();
        }
    }
}

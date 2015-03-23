package com.wavemaker.runtime.data.spring;

import java.util.List;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

/**
 * @author: sowmyad
 */
public class WMPageImpl<T> extends PageImpl {


    public WMPageImpl(List content, Pageable pageable, long total) {
        super(content, pageable, total);
    }

    public WMPageImpl(List content) {
        super(content);
    }
    public String toString(){

        String contentType = "UNKNOWN";
        List<T> content = getContent();

        if (content.size() > 0 && content.get(0) != null) {
            contentType = content.get(0).getClass().getName();
        }

        return String.format("Page %s of %d containing %s instances", getNumber(), getTotalPages(), contentType);
    }
}

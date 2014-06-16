package com.wavemaker.runtime.data.json;

import com.fasterxml.jackson.databind.AnnotationIntrospector;
import com.fasterxml.jackson.datatype.hibernate4.Hibernate4Module;

/**
 * Created by venuj on 16-06-2014.
 */
public class WMHibernate4Module extends Hibernate4Module {

    @Override
    protected AnnotationIntrospector annotationIntrospector() {
        WMHibernateAnnotationIntrospector ai = new WMHibernateAnnotationIntrospector();
        ai.setUseTransient(isEnabled(Feature.USE_TRANSIENT_ANNOTATION));
        return ai;
    }

}

package com.wavemaker.runtime.data.json;

import com.fasterxml.jackson.databind.introspect.AnnotatedMember;
import com.fasterxml.jackson.datatype.hibernate4.HibernateAnnotationIntrospector;

import javax.persistence.OneToMany;
import javax.persistence.OneToOne;

/**
 * Created by venuj on 16-06-2014.
 */
public class WMHibernateAnnotationIntrospector extends HibernateAnnotationIntrospector {

    @Override
    public boolean hasIgnoreMarker(AnnotatedMember m) {
        boolean ignored = super.hasIgnoreMarker(m);
        if(!ignored) {
            ignored = (m.hasAnnotation(OneToMany.class)||m.hasAnnotation(OneToOne.class));
        }
        return ignored;
    }
}

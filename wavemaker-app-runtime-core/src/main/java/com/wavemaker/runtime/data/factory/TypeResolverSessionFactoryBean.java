package com.wavemaker.runtime.data.factory;

import org.hibernate.SessionFactory;
import org.springframework.orm.hibernate4.LocalSessionFactoryBean;
import org.springframework.orm.hibernate4.LocalSessionFactoryBuilder;

import com.wavemaker.runtime.data.CustomType;

/**
 * Created by sunilp on 26/7/15.
 */
public class TypeResolverSessionFactoryBean extends LocalSessionFactoryBean {

    private CustomType[] customTypes;

    @Override
    protected SessionFactory buildSessionFactory(LocalSessionFactoryBuilder sfb) {
        if(customTypes != null) {
            registerCustomTypes(sfb);
        }
        return sfb.buildSessionFactory();
    }

    protected void registerCustomTypes(LocalSessionFactoryBuilder sfb) {
        for (CustomType customType : customTypes) {
            sfb.registerTypeOverride(customType.getType(), customType.getKeys());
        }
    }

    public void setCustomTypes(CustomType[] customTypes) {
        this.customTypes = customTypes;
    }
}

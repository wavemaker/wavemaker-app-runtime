package com.wavemaker.studio.common.util;

import java.io.InputStream;
import java.io.Reader;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

import com.sun.xml.bind.v2.runtime.unmarshaller.UnmarshallerImpl;

/**
 * @author Uday Shankar
 */
public class JAXBUtils {
    public static <T> T unMarshall(JAXBContext context, InputStream inputStream) throws JAXBException {
        Unmarshaller unmarshaller = null;
        try {
            unmarshaller = context.createUnmarshaller();
            return (T) unmarshaller.unmarshal(inputStream);
        } finally {
            closeResources(inputStream, unmarshaller);
        }
    }

    public static <T> T unMarshall(JAXBContext context, Reader reader) throws JAXBException {
        Unmarshaller unmarshaller = null;
        try {
            unmarshaller = context.createUnmarshaller();
            return (T) unmarshaller.unmarshal(reader);
        } finally {
            closeResources(reader, unmarshaller);
        }
    }

    private static void closeResources(AutoCloseable resourceStream, Unmarshaller unmarshaller) {
        IOUtils.closeByLogging(resourceStream);
        //Doing it on implementation check as the specific needs to be closed to prevent thread local memory leaks
        if (unmarshaller != null && unmarshaller instanceof UnmarshallerImpl) {
            IOUtils.closeByLogging((UnmarshallerImpl) unmarshaller);
        }
    }
}

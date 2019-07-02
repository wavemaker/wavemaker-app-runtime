package com.wavemaker.runtime.security.xss;

import java.awt.print.Pageable;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.core.MethodParameter;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.web.interceptor.RestMethodArgumentsInterceptor;
import com.wavemaker.runtime.security.xss.handler.XSSSecurityHandler;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 2/8/18
 */
public class XssRestMethodArgumentsInterceptor implements RestMethodArgumentsInterceptor {

    private static final List<Class<?>> EXCLUDED_CLASSES = Arrays.asList(HttpServletRequest.class,
            HttpServletResponse.class, Pageable.class);

    private static final EnumSet<RequestMethod> SUPPORTED_METHODS = EnumSet.of(RequestMethod.POST, RequestMethod.PUT);

    @Override
    public boolean supports(final Method method, final MethodParameter[] parameters) {
        boolean supports = false;

        if (XSSSecurityHandler.getInstance().isXSSEnabled()) {
            final RequestMapping requestMapping = getAnnotation(method, RequestMapping.class);
            if (Objects.nonNull(requestMapping)) {
                supports = Arrays.stream(requestMapping.method()).anyMatch(SUPPORTED_METHODS::contains);

                if (supports) {
                    supports = getAnnotation(method.getDeclaringClass(), XssDisable.class) == null;

                    if (supports) {
                        supports = getAnnotation(method, XssDisable.class) == null;
                    }
                }
            }
        }

        return supports;
    }

    @Override
    public Object[] intercept(final Method method, final MethodParameter[] parameters, final Object[] arguments) {

        final Annotation[][] annotations = method.getParameterAnnotations();

        for (int i = 0; i < annotations.length; i++) {
            if (!isAnnotationPresent(annotations[i], XssDisable.class)) {
                arguments[i] = encode(arguments[i], new HashSet<>()).value;
            }
        }

        return arguments;
    }

    private ResponseTuple encode(Object value, Set<Object> manipulatedObjects) {
        Object encoded = value;
        boolean modified = false;

        if (value != null && !(value instanceof Number) && !(manipulatedObjects.contains(value) || isExcludedClass(value))) {
            final Class<?> valueClass = value.getClass();

            if (valueClass == char[].class) {
                encoded = encode(((char[]) value));
                modified = true;
            } else if (valueClass.isArray()) {
                modified = encodeArray((Object[]) value, manipulatedObjects);
            } else if (value instanceof String) {
                encoded = encode((String) value);
                modified = true;
            } else {
                manipulatedObjects.add(value);
                final ResponseTuple response = encodeCustomClass(value, manipulatedObjects);
                if (response.modified) {
                    encoded = response.value;
                    modified = true;
                }
            }
        }

        return new ResponseTuple(encoded, modified);
    }

    private boolean encodeArray(
            final Object[] valueArray, final Set<Object> manipulatedObjects) {
        boolean modified = false;
        for (int i = 0; i < valueArray.length; i++) {
            final Object obj = valueArray[i];
            final ResponseTuple result = encode(obj, manipulatedObjects);
            if (result.modified) {
                valueArray[i] = result.value;
                modified = true;
            }
        }
        return modified;
    }

    private ResponseTuple encodeCustomClass(Object object, Set<Object> manipulatedObjects) {
        boolean modified = false;
        for (final Field field : object.getClass().getDeclaredFields()) {
            if (!field.isAnnotationPresent(XssDisable.class) && !Modifier.isFinal(field.getModifiers())) {
                field.setAccessible(true);
                try {
                    final ResponseTuple response = encode(field.get(object), manipulatedObjects);
                    if (response.modified) {
                        modified = true;
                        field.set(object, response.value);
                    }
                } catch (IllegalAccessException e) {
                    throw new WMRuntimeException(MessageResource.create("reflection.field.error"), e, field.getName(),
                            field.getDeclaringClass().getName());
                }
            }
        }
        return new ResponseTuple(object, modified);
    }

    private char[] encode(char[] value) {
        return encode(new String(value)).toCharArray();
    }

    private String encode(String value) {
        return XSSSecurityHandler.getInstance().sanitizeRequestData(value);
    }

    private boolean isAnnotationPresent(Annotation[] annotations, Class<? extends Annotation> annotationType) {
        return Arrays.stream(annotations).anyMatch(annotationType::isInstance);
    }

    private boolean isExcludedClass(Object value) {
        Class<?> valueClass = value.getClass();
        boolean excluded = valueClass.isAnnotationPresent(XssDisable.class);

        if (!excluded) {
            excluded = (valueClass.getComponentType() != null && valueClass.getComponentType().isPrimitive() && valueClass != char[].class);

            if (!excluded) {
                excluded = EXCLUDED_CLASSES.stream().anyMatch(type -> type.isInstance(value));
            }
        }

        return excluded;
    }

    private static class ResponseTuple {

        private Object value;
        private boolean modified;

        public ResponseTuple(final Object value, final boolean modified) {
            this.value = value;
            this.modified = modified;
        }
    }
}

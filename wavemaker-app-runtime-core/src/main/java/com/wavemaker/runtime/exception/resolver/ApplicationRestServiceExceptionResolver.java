/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.exception.resolver;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.hibernate.exception.GenericJDBCException;
import org.hibernate.exception.SQLGrammarException;
import org.hibernate.validator.method.MethodConstraintViolation;
import org.hibernate.validator.method.MethodConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.core.web.rest.ErrorResponse;
import com.wavemaker.commons.core.web.rest.ErrorResponses;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.exception.QueryParameterMismatchException;

/**
 * @author sunilp
 */
public class ApplicationRestServiceExceptionResolver extends AbstractHandlerExceptionResolver {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationRestServiceExceptionResolver.class);

    @Override
    protected ModelAndView doResolveException(
            HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {

        logger.error("Error occurred while serving the request with url {}", request.getRequestURI(), ex);

        if (ex instanceof MethodArgumentTypeMismatchException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleRuntimeException((MethodArgumentTypeMismatchException) ex);
        } else if (ex instanceof MethodArgumentNotValidException) {
            return handleMethodArgumentNotValidException((MethodArgumentNotValidException) ex, response);
        } else if (ex instanceof MethodConstraintViolationException) {
            return handleMethodConstraintViolationException((MethodConstraintViolationException) ex, response);
        } else if (ex instanceof HttpMessageNotReadableException) {
            return handleHttpMessageNotReadableException((HttpMessageNotReadableException) ex, response);
        } else if (ex instanceof ConstraintViolationException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleRuntimeException((ConstraintViolationException) ex);
        } else if (ex instanceof EntityNotFoundException) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return handleEntityNotFoundException((EntityNotFoundException) ex);
        } else if (ex instanceof DataIntegrityViolationException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleRuntimeException((DataIntegrityViolationException) ex);
        } else if (ex instanceof GenericJDBCException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleRuntimeException((GenericJDBCException) ex);
        } else if (ex instanceof SQLGrammarException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleRuntimeException((SQLGrammarException) ex);
        } else if (ex instanceof QueryParameterMismatchException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleRuntimeException((QueryParameterMismatchException) ex);
        } else if (ex instanceof WMRuntimeException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleWMExceptions((WMRuntimeException) ex);
        } else if (ex instanceof HttpMessageNotReadableException) {
            return handleHttpMessageNotReadableException((HttpMessageNotReadableException) ex, response);
        } else {
            logger.error("Unknown error for url {}", request.getRequestURI(), ex);
            return handleException(ex, response);
        }
    }

    private ModelAndView handleMethodArgumentNotValidException(
            MethodArgumentNotValidException methodArgumentNotValidException, HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        BindingResult bindingResult = methodArgumentNotValidException.getBindingResult();
        List<ObjectError> allErrors = bindingResult.getAllErrors();
        if (allErrors != null) {
            List<ErrorResponse> errorResponseList = new ArrayList<>(allErrors.size());
            for (ObjectError objectError : allErrors) {
                if (objectError instanceof FieldError) {
                    FieldError fieldError = (FieldError) objectError;
                    errorResponseList
                            .add(getErrorResponse(MessageResource.INVALID_FIELD_VALUE, fieldError.getField(),
                                    fieldError.getDefaultMessage()));
                } else {
                    errorResponseList
                            .add(getErrorResponse(MessageResource.INVALID_OBJECT, objectError.getObjectName(),
                                    objectError.getDefaultMessage()));
                }
                objectError.getObjectName();
            }
            return getModelAndView(errorResponseList);
        } else {
            return getModelAndView(Collections.EMPTY_LIST);
        }
    }

    private ModelAndView handleMethodConstraintViolationException(
            MethodConstraintViolationException ex,
            HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        List<ErrorResponse> errorResponseList = new ArrayList();
        Set<MethodConstraintViolation<?>> constraintViolations = ex.getConstraintViolations();
        if (constraintViolations != null) {
            for (MethodConstraintViolation<?> methodConstraintViolation : constraintViolations) {
                if (methodConstraintViolation.getKind().equals(MethodConstraintViolation.Kind.PARAMETER)) {
                    Integer parameterIndex = methodConstraintViolation.getParameterIndex();
                    String paramName = getParameterName(methodConstraintViolation, parameterIndex);
                    paramName = (paramName != null) ? paramName : methodConstraintViolation.getParameterName();
                    errorResponseList.add(getErrorResponse(MessageResource.INVALID_FIELD_VALUE, paramName,
                            methodConstraintViolation.getMessage()));
                }
            }
        }
        return getModelAndView(errorResponseList);
    }

    private String getParameterName(MethodConstraintViolation<?> methodConstraintViolation, Integer parameterIndex) {
        Method method = methodConstraintViolation.getMethod();
        Annotation[] annotations = method.getParameterAnnotations()[parameterIndex];
        for (Annotation annotation : annotations) {
            if (annotation instanceof RequestParam) {
                return ((RequestParam) annotation).value();
            }
            if (annotation instanceof PathVariable) {
                return ((PathVariable) annotation).value();
            }
        }
        return null;
    }

    private ModelAndView handleRuntimeException(RuntimeException ex) {
        String msg = ExceptionUtils.getRootCauseMessage(ex);
        ErrorResponse errorResponse = getErrorResponse(MessageResource.UNEXPECTED_ERROR, msg);
        return getModelAndView(errorResponse);
    }

    private ModelAndView handleEntityNotFoundException(EntityNotFoundException ex) {
        ErrorResponse errorResponse = getErrorResponse(MessageResource.ENTITY_NOT_FOUND);
        return getModelAndView(errorResponse);
    }

    private ModelAndView handleRuntimeException(DataIntegrityViolationException ex) {
        ErrorResponse errorResponse = getErrorResponse(MessageResource.DATA_INTEGRITY_VIOALATION,
                ex.getMostSpecificCause().getMessage());
        return getModelAndView(errorResponse);
    }

    private ModelAndView handleException(Exception ex, HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        String msg = (ex.getMessage() != null) ? ex.getMessage() : "";
        ErrorResponse errorResponse = getErrorResponse(MessageResource.UNEXPECTED_ERROR, msg);
        return getModelAndView(errorResponse);
    }

    private ModelAndView handleWMExceptions(WMRuntimeException ex) {
        MessageResource messageResource = ex.getMessageResource();
        ErrorResponse errorResponse = null;
        if (messageResource != null) {
            errorResponse = getErrorResponse(ex.getMessageResource(), ex.getArgs());
        } else {
            String msg = (ex.getMessage() != null) ? ex.getMessage() : "";
            errorResponse = getErrorResponse(MessageResource.UNEXPECTED_ERROR, msg);
        }
        return getModelAndView(errorResponse);
    }

    private ModelAndView handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex,
            HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        Throwable exCause = ex.getCause();
        ErrorResponse errorResponse = null;
        if (exCause != null) {
            if (exCause instanceof UnrecognizedPropertyException) {
                errorResponse = getErrorResponse(MessageResource.UNRECOGNIZED_FIELD,
                        ((UnrecognizedPropertyException) exCause).getPropertyName());
            } else if (exCause instanceof JsonMappingException) {
                errorResponse = getErrorResponse(MessageResource.INVALID_JSON, exCause.getMessage());
            }
        }
        if (errorResponse == null) {
            errorResponse = getErrorResponse(MessageResource.MESSAGE_NOT_READABLE);
        }
        return getModelAndView(errorResponse);
    }

    private ErrorResponse getErrorResponse(MessageResource messageResource, Object... args) {
        List<String> parameters = new ArrayList<>();
        if (args != null) {
            for (Object arg : args) {
                if (arg != null) {
                    parameters.add(arg.toString());
                    continue;
                }
                parameters.add(null);
            }
        }
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setMessageKey(messageResource.getMessageKey());
        errorResponse.setParameters(parameters);
        return errorResponse;
    }

    private ModelAndView getModelAndView(ErrorResponse errorResponse) {
        List<ErrorResponse> errorResponseList = new ArrayList<>(1);
        errorResponseList.add(errorResponse);
        return getModelAndView(errorResponseList);
    }

    private ModelAndView getModelAndView(List<ErrorResponse> errorResponseList) {
        return getModelAndView(new ErrorResponses(errorResponseList));
    }

    private ModelAndView getModelAndView(ErrorResponses errorResponses) {
        ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject("errors", errorResponses);
        return modelAndView;
    }
}

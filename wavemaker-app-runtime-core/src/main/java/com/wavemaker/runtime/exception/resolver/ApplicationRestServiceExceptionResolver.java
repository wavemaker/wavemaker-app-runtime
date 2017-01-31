/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.exception.resolver;

import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.hibernate.exception.GenericJDBCException;
import org.hibernate.exception.SQLGrammarException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.exception.QueryParameterMismatchException;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.core.web.rest.ErrorResponse;
import com.wavemaker.commons.core.web.rest.ErrorResponses;

/**
 * @author sunilp
 */
public class ApplicationRestServiceExceptionResolver extends AbstractHandlerExceptionResolver {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationRestServiceExceptionResolver.class);

    @Override
    protected ModelAndView doResolveException(
            HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {

        logger.error("Error occurred while serving the request with url {}", request.getRequestURI(), ex);

        if (ex instanceof EntityNotFoundException) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return handleRuntimeException((EntityNotFoundException) ex);
        } else if (ex instanceof ConstraintViolationException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleRuntimeException((ConstraintViolationException) ex);
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

    private ModelAndView handleRuntimeException(RuntimeException ex) {
        String msg = ExceptionUtils.getRootCauseMessage(ex);
        ErrorResponse errorResponse = getErrorResponse(MessageResource.UNEXPECTED_ERROR, msg);
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

package com.wavemaker.runtime.data.exceptionresolver;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.ObjectUtils;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.exception.QueryParameterMismatchException;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;

/**
 * @author sunilp
 */
public class ApplicationRestServiceExceptionResolver extends AbstractHandlerExceptionResolver {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationRestServiceExceptionResolver.class);

    @Override
    protected ModelAndView doResolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {

        logger.error("Error occurred while serving the request with url [" + request.getRequestURI() + "]", ex);

        if (ex instanceof EntityNotFoundException) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return handleException((EntityNotFoundException) ex);
        } else if (ex instanceof ConstraintViolationException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleException((ConstraintViolationException) ex);
        } else if (ex instanceof DataIntegrityViolationException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleException((DataIntegrityViolationException) ex);
        } else if (ex instanceof QueryParameterMismatchException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleException((QueryParameterMismatchException) ex);
        } else if (ex instanceof WMRuntimeException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleException((WMRuntimeException) ex);
        } else if (ex instanceof HttpMessageNotReadableException) {
            return handleHttpMessageNotReadableException((HttpMessageNotReadableException) ex, response);
        } else {
            logger.error("Unknown error for url [" + request.getRequestURI() + "]", ex);
            return handleOtherExceptions(ex, response);
        }
    }

    private ModelAndView handleException(RuntimeException ex) {
        ModelAndView modelAndView = null;
        Error error = new Error();
        error.setMessage(ExceptionUtils.getRootCauseMessage(ex));
        modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject(error);
        return modelAndView;
    }

    private ModelAndView handleOtherExceptions(Exception ex, HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        Error error = new Error();
        String errorMessage = ExceptionUtils.getRootCauseMessage(ex);
        error.setMessage(errorMessage != null ? errorMessage : "Unexpected error,please check server logs for more information");
        ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject(error);
        return modelAndView;
    }

    private ModelAndView handleHttpMessageNotReadableException(HttpMessageNotReadableException ex,
                                                               HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        Throwable exCause = ex.getCause();
        Error error = new Error();
        if (exCause != null) {
            if (exCause instanceof UnrecognizedPropertyException) {
                error.setMessage(" Unrecognized field " + ((UnrecognizedPropertyException) exCause).getPropertyName());
            } else if (exCause instanceof JsonMappingException) {
                error.setMessage("Incorrect Json Object : " + ExceptionUtils.getRootCauseMessage(exCause));
            }
        }
        if (ObjectUtils.isNullOrEmpty(error.getMessage())) {
            error.setMessage("Message not readable");
        }
        List<Error> errors = new ArrayList<Error>(1);
        errors.add(error);
        ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject("errors", errors);
        return modelAndView;
    }

    private class Error {

        private String message;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

}

package com.wavemaker.runtime.data.ExceptionResolver;

import com.wavemaker.common.*;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.exception.QueryParameterMismatchException;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver;
import org.springframework.web.servlet.view.json.MappingJackson2JsonView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * @author sunilp
 */
public class DataModelRestServiceExceptionResolver extends AbstractHandlerExceptionResolver {

    private static final Logger logger = LoggerFactory.getLogger(DataModelRestServiceExceptionResolver.class);

    @Override
    protected ModelAndView doResolveException(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {

        logger.error("Error occurred while serving the request with url [" + request.getRequestURI() + "]", ex);

        if (ex instanceof EntityNotFoundException) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return handleDMExceptions((EntityNotFoundException) ex);
        } else if (ex instanceof ConstraintViolationException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleDMExceptions((ConstraintViolationException) ex);
        } else if (ex instanceof DataIntegrityViolationException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleDMExceptions((DataIntegrityViolationException) ex);
        }else if (ex instanceof QueryParameterMismatchException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleDMExceptions((QueryParameterMismatchException) ex);
        } else {
            logger.error("Unknown error for url [" + request.getRequestURI() + "]", ex);
            return handleOtherExceptions(ex,response);
        }
    }

    private ModelAndView handleDMExceptions(RuntimeException ex) {
        ModelAndView modelAndView = null;
        Error error = new Error();
        error.setMessage(ExceptionUtils.getRootCauseMessage(ex));
        modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject(error);
        return modelAndView;
    }

    private ModelAndView handleOtherExceptions(Exception ex,HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        Error error = new Error();
        String errorMessage = ExceptionUtils.getRootCauseMessage(ex);
        error.setMessage(errorMessage != null ? errorMessage : "Unexpected error,please check server logs for more information");
        ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject(error);
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

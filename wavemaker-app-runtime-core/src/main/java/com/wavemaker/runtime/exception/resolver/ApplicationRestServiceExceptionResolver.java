package com.wavemaker.runtime.exception.resolver;

import java.rmi.RemoteException;
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
import com.wavemaker.studio.common.MessageResource;
import com.wavemaker.studio.common.WMRuntimeException;

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
        }else if (ex instanceof SQLGrammarException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleRuntimeException((SQLGrammarException) ex);
        }else if (ex instanceof QueryParameterMismatchException) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return handleRuntimeException((QueryParameterMismatchException) ex);
        } else if (ex instanceof WMRuntimeException) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return handleWMExceptions((WMRuntimeException) ex);
        } else if (ex instanceof HttpMessageNotReadableException) {
            return handleHttpMessageNotReadableException((HttpMessageNotReadableException) ex, response);
        } else {
            logger.error("Unknown error for url [" + request.getRequestURI() + "]", ex);
            return handleException(ex, response);
        }
    }

    private ModelAndView handleRuntimeException(RuntimeException ex) {
        String msg = ExceptionUtils.getRootCauseMessage(ex);
        ErrorDetails errorDetails = getErrorDetails(MessageResource.UNEXPECTED_ERROR, msg);
        return prepareModelViewObj(errorDetails);
    }

    private ModelAndView handleException(Exception ex, HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        String msg = (ex.getMessage() != null) ? ex.getMessage() : "";
        ErrorDetails errorDetails = getErrorDetails(MessageResource.UNEXPECTED_ERROR, msg);
        return prepareModelViewObj(errorDetails);
    }

    private ModelAndView handleWMExceptions(WMRuntimeException ex) {
        ModelAndView modelAndView = null;
        if (ex.getCause() instanceof RemoteException) {
            modelAndView = new ModelAndView(ex.getCause().getMessage());
        } else {
            MessageResource messageResource = ex.getMessageResource();
            ErrorDetails errorDetails = null;
            if (messageResource != null) {
                errorDetails = getErrorDetails(ex.getMessageResource(), ex.getArgs());
            } else {
                String msg = (ex.getMessage() != null) ? ex.getMessage() : "";
                errorDetails = getErrorDetails(MessageResource.UNEXPECTED_ERROR, msg);
            }
            modelAndView = new ModelAndView(new MappingJackson2JsonView());
            modelAndView.addObject(errorDetails);
        }
        return modelAndView;
    }

    private ModelAndView handleHttpMessageNotReadableException(HttpMessageNotReadableException ex,
                                                               HttpServletResponse response) {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        Throwable exCause = ex.getCause();
        ErrorDetails msg = null;
        if (exCause != null) {
            if (exCause instanceof UnrecognizedPropertyException) {
                msg = getErrorDetails(MessageResource.UNRECOGNIZED_FIELD,
                        ((UnrecognizedPropertyException) exCause).getPropertyName());
            } else if (exCause instanceof JsonMappingException) {
                msg = getErrorDetails(MessageResource.INVALID_JSON, exCause.getMessage());
            }
        }
        if (msg == null) {
            msg = getErrorDetails(MessageResource.MESSAGE_NOT_READABLE);
        }
        List<ErrorDetails> errors = new ArrayList<>(1);
        errors.add(msg);
        ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject("errors", errors);
        return modelAndView;
    }

    private ErrorDetails getErrorDetails(MessageResource messageResource, Object... args) {
        ErrorDetails errorDetails = new ErrorDetails();
        List<String> data = new ArrayList<>();
        errorDetails.setCode(messageResource.getMessageKey());
        if (args != null) {
            for (Object arg : args) {
                if (arg != null) {
                    data.add(arg.toString());
                    continue;
                }
                data.add(null);
            }
        }
        errorDetails.setData(data);
        return errorDetails;
    }

    private ModelAndView prepareModelViewObj(ErrorDetails errorDetails)
    {
        ModelAndView modelAndView = new ModelAndView(new MappingJackson2JsonView());
        modelAndView.addObject(errorDetails);
        return modelAndView;
    }


    public class ErrorDetails {
        private String code;
        private List<String> data;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public List<String> getData() {
            return data;
        }

        public void setData(List<String> data) {
            this.data = data;
        }
    }

}

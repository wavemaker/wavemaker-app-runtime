package com.wavemaker.runtime.data.exception;

public class QueryParameterMismatchException extends RuntimeException {
	
	private static final long serialVersionUID = 1L;

	public QueryParameterMismatchException(String message)
	{
		super(message);
	}

	public QueryParameterMismatchException(String message, Exception e) {
		super(message, e);
	}

}

package com.wavemaker.runtime.data.exception;

public class EntityNotFoundException extends RuntimeException {
	
	private static final long serialVersionUID = 1L;

    public EntityNotFoundException() {
        super();
    }

    public EntityNotFoundException(String message)
	{
		super(message);
	}

	public EntityNotFoundException(String message, Exception e) {
		super(message, e);
	}

}

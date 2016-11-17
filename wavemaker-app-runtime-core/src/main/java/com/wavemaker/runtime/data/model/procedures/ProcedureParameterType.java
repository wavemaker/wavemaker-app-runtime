package com.wavemaker.runtime.data.model.procedures;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 5/10/16
 */
public enum ProcedureParameterType {
    IN {
        @Override
        public boolean isOutParam() {
            return false;
        }
    },
    OUT {
        @Override
        public boolean isInParam() {
            return false;
        }
    },
    IN_OUT;

    public boolean isOutParam() {
        return true;
    }

    public boolean isInParam() {
        return true;
    }
}

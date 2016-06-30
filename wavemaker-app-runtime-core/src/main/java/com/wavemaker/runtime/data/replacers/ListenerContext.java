package com.wavemaker.runtime.data.replacers;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class ListenerContext {

    private Object entity;
    private Scope phase;

    public ListenerContext(final Object entity, final Scope phase) {
        this.entity = entity;
        this.phase = phase;
    }

    public Object getEntity() {
        return entity;
    }

    public Scope getPhase() {
        return phase;
    }
}

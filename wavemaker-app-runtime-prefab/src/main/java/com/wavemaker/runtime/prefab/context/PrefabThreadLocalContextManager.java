package com.wavemaker.runtime.prefab.context;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

/**
 *
 * @author Uday Shankar
 */
@Service
public class PrefabThreadLocalContextManager {

    private ThreadLocal<ApplicationContext> activeContext = new ThreadLocal<>();
    
    public ApplicationContext getContext() {
        return activeContext.get();
    }

    public void setContext(ApplicationContext applicationContext) {
        activeContext.set(applicationContext);
    }
    
    public void clearContext() {
        activeContext.remove();
    }
}

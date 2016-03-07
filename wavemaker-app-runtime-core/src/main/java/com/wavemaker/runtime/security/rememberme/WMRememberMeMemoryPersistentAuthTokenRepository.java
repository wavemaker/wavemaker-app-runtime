package com.wavemaker.runtime.security.rememberme;

import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.token.repository.AbstractPersistentAuthTokenRepository;

/**
 * Created by ArjunSahasranam on 7/3/16.
 */
public class WMRememberMeMemoryPersistentAuthTokenRepository extends
        AbstractPersistentAuthTokenRepository<WMAppRememberMeServices.UniqueUserId, WMUser> {

    public WMRememberMeMemoryPersistentAuthTokenRepository(final int tokenValiditySeconds) {
        super(tokenValiditySeconds);
    }

}

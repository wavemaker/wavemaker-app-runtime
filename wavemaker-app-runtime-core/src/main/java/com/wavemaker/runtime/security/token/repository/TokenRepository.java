package com.wavemaker.runtime.security.token.repository;

import com.wavemaker.runtime.security.WMUser;

/**
 * Created by prakashb on 2/1/19.
 */
public interface TokenRepository {

    void addToken(String token, WMUser wmUser);

    WMUser loadUser(String token);

    void removeUser(String token);

}

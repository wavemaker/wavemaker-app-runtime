package com.wavemaker.runtime.security.model;

import java.util.Arrays;

/**
 * Created by ArjunSahasranam on 13/1/16.
 */
public class UserInfo {
    private String userId;
    private String userName;
    private String[] userRoles;
    private String landingPage;

    public String getUserId() {
        return userId;
    }

    public void setUserId(final String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(final String userName) {
        this.userName = userName;
    }

    public String[] getUserRoles() {
        return userRoles;
    }

    public void setUserRoles(final String[] userRoles) {
        this.userRoles = userRoles;
    }

    public String getLandingPage() {
        return landingPage;
    }

    public void setLandingPage(final String landingPage) {
        this.landingPage = landingPage;
    }

    @Override
    public String toString() {
        return "UserInfo{" +
                "userId='" + userId + '\'' +
                ", userName='" + userName + '\'' +
                ", userRoles=" + Arrays.toString(userRoles) +
                ", landingPage='" + landingPage + '\'' +
                '}';
    }
}

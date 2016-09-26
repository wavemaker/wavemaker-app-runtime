package com.wavemaker.runtime.security.social;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.social.connect.UsersConnectionRepository;
import org.springframework.social.security.SocialAuthenticationFilter;
import org.springframework.social.security.SocialAuthenticationServiceLocator;

/**
 * @author Uday Shankar
 */
public class OAuthAuthenticationFilter extends SocialAuthenticationFilter {

	public OAuthAuthenticationFilter(AuthenticationManager authManager, SocialAuthenticationServiceLocator authServiceLocator) {
		this(authManager, null, authServiceLocator);
	}

	public OAuthAuthenticationFilter(AuthenticationManager authManager, UsersConnectionRepository usersConnectionRepository, SocialAuthenticationServiceLocator authServiceLocator) {
		super(authManager, null, usersConnectionRepository, authServiceLocator);
		setUpdateConnections(false);
	}

	@Override
	protected boolean requiresAuthentication(HttpServletRequest request, HttpServletResponse response) {
		Authentication auth = getAuthentication();
		if (auth != null && auth.isAuthenticated()) {
			return false;
		}
		return super.requiresAuthentication(request, response);

	}

	private Authentication getAuthentication() {
		return SecurityContextHolder.getContext().getAuthentication();
	}
}

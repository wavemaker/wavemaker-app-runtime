package com.wavemaker.runtime.security.provider.saml.websso;

import org.joda.time.DateTime;
import org.opensaml.common.SAMLException;
import org.opensaml.common.SAMLObject;
import org.opensaml.saml2.core.AuthnStatement;
import org.opensaml.saml2.core.Issuer;
import org.opensaml.saml2.core.LogoutRequest;
import org.opensaml.saml2.core.NameID;
import org.opensaml.saml2.core.SessionIndex;
import org.opensaml.saml2.core.StatusCode;
import org.opensaml.saml2.metadata.Endpoint;
import org.opensaml.xml.encryption.DecryptionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.security.saml.SAMLStatusException;
import org.springframework.security.saml.context.SAMLMessageContext;
import org.springframework.security.saml.websso.SingleLogoutProfileImpl;

import com.wavemaker.runtime.security.provider.saml.SAMLConfig;
import com.wavemaker.runtime.security.provider.saml.util.SAMLUtil;

import static org.springframework.security.saml.util.SAMLUtil.isDateTimeSkewValid;

/**
 * Created by ArjunSahasranam on 25/11/16.
 */
public class WMSingleLogoutProfileImpl extends SingleLogoutProfileImpl {
    @Autowired
    private SAMLConfig samlConfig;

    @Override
    public boolean processLogoutRequest(
            final SAMLMessageContext context, final SAMLCredential credential) throws SAMLException {
        final SAMLConfig.ValidateType validateType = samlConfig.getValidateType();
        if (SAMLConfig.ValidateType.RELAXED == validateType) {
            SAMLObject message = context.getInboundSAMLMessage();

            // Verify type
            if (message == null || !(message instanceof LogoutRequest)) {
                throw new SAMLException("Message is not of a LogoutRequest object type");
            }

            LogoutRequest logoutRequest = (LogoutRequest) message;

            // Verify destination
            try {
                verifyEndpoint(context.getLocalEntityEndpoint(), logoutRequest.getDestination());
            } catch (SAMLException e) {
                throw new SAMLStatusException(StatusCode.REQUEST_DENIED_URI,
                        "Destination of the LogoutRequest does not match any of the single logout endpoints");
            }

            // Verify issuer
            try {
                if (logoutRequest.getIssuer() != null) {
                    Issuer issuer = logoutRequest.getIssuer();
                    verifyIssuer(issuer, context);
                }
            } catch (SAMLException e) {
                throw new SAMLStatusException(StatusCode.REQUEST_DENIED_URI, "Issuer of the LogoutRequest is unknown");
            }

            // Verify issue time
            DateTime time = logoutRequest.getIssueInstant();
            if (!isDateTimeSkewValid(getResponseSkew(), time)) {
                throw new SAMLStatusException(StatusCode.REQUESTER_URI,
                        "LogoutRequest issue instant is either too old or with date in the future");
            }

            // Check whether any user is logged in
            if (credential == null) {
                throw new SAMLStatusException(StatusCode.UNKNOWN_PRINCIPAL_URI, "No user is logged in");
            }

            // Find index for which the logout is requested
            boolean indexFound = false;
            if (logoutRequest.getSessionIndexes() != null && logoutRequest.getSessionIndexes().size() > 0) {
                for (AuthnStatement statement : credential.getAuthenticationAssertion().getAuthnStatements()) {
                    String statementIndex = statement.getSessionIndex();
                    if (statementIndex != null) {
                        for (SessionIndex index : logoutRequest.getSessionIndexes()) {
                            if (statementIndex.equals(index.getSessionIndex())) {
                                indexFound = true;
                            }
                        }
                    }
                }
            } else {
                indexFound = true;
            }

            // Fail if sessionIndex is not found in any assertion
            if (!indexFound) {

                // Check logout request still valid and store request
                //if (logoutRequest.getNotOnOrAfter() != null) {
                // TODO store request for assertions possibly arriving later
                //}

                throw new SAMLStatusException(StatusCode.REQUESTER_URI, "The SessionIndex was not found");

            }

            try {
                // Fail if NameId doesn't correspond to the currently logged user
                NameID nameID = getNameID(context, logoutRequest);
                if (nameID == null || !equalsNameID(credential.getNameID(), nameID)) {
                    throw new SAMLStatusException(StatusCode.UNKNOWN_PRINCIPAL_URI, "The requested NameID is invalid");
                }
            } catch (DecryptionException e) {
                throw new SAMLStatusException(StatusCode.RESPONDER_URI, "The NameID can't be decrypted", e);
            }

            return true;
        } else return super.processLogoutRequest(context, credential);
    }

    private boolean equalsNameID(NameID a, NameID b) {
        boolean equals = !differ(a.getSPProvidedID(), b.getSPProvidedID());
        equals = equals && !differ(a.getValue(), b.getValue());
        return equals;
    }

    private boolean differ(Object a, Object b) {
        if (a == null) {
            return b != null;
        } else {
            return !a.equals(b);
        }
    }

    @Override
    protected void verifyEndpoint(final Endpoint endpoint, final String destination) throws SAMLException {
        final SAMLConfig.ValidateType validateType = samlConfig.getValidateType();
        if (SAMLConfig.ValidateType.RELAXED == validateType) {
            if (destination != null) {
                if (SAMLUtil.relaxedCompareUrls(destination, endpoint.getLocation(), validateType)) {
                    // Expected
                } else if (SAMLUtil.relaxedCompareUrls(destination, endpoint.getResponseLocation(), validateType)) {
                    // Expected
                } else {
                    throw new SAMLException(
                            "Intended destination " + destination + " doesn't match any of the endpoint URLs on endpoint " + endpoint
                                    .getLocation() + " for profile " + getProfileIdentifier());
                }
            }
            return;
        } else super.verifyEndpoint(endpoint, destination);
    }
}

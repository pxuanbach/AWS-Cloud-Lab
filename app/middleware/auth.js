const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');

// JWT verification for both development and production environments
async function verifyToken(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // For Cognito Local - simple decode without full verification
        if (process.env.COGNITO_ENDPOINT?.includes('cognito-local') || process.env.COGNITO_ENDPOINT?.includes('localhost')) {
            try {
                const decoded = jwt.decode(token);
                if (decoded && (decoded.sub || decoded.username)) {
                    // Generate a proper display name from email if name is UUID or missing
                    let displayName = decoded.name || decoded.email || decoded.username || 'User';
                    
                    // If name looks like UUID, use email prefix instead
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidRegex.test(displayName)) {
                        const email = decoded.email || decoded.username;
                        if (email && email.includes('@')) {
                            displayName = email.split('@')[0];
                        } else {
                            displayName = 'User';
                        }
                    }
                    
                    req.user = {
                        id: decoded.sub || decoded.username,
                        email: decoded.email || decoded.username,
                        name: displayName
                    };
                    return next();
                }
            } catch (err) {
                console.error('Local JWT decode error:', err);
            }
        }

        // Production Cognito verification
        const region = process.env.AWS_REGION || 'us-east-1';
        const userPoolId = process.env.COGNITO_USER_POOL_ID;
        const cognitoEndpoint = process.env.COGNITO_ENDPOINT;
        
        if (!userPoolId) {
            return res.status(500).json({ error: 'Cognito not configured' });
        }

        let jwksUrl;
        
        // Check if using Cognito Local
        if (cognitoEndpoint && (cognitoEndpoint.includes('localhost') || cognitoEndpoint.includes('cognito-local'))) {
            // For Cognito Local, use local endpoint
            jwksUrl = `${cognitoEndpoint}/${userPoolId}/.well-known/jwks.json`;
        } else {
            // For AWS Cognito, use standard URL
            jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
        }

        // Get JWKs from Cognito (Local or AWS)
        const response = await axios.get(jwksUrl);
        const jwks = response.data.keys;
        
        // Decode token header to get kid
        const decodedHeader = jwt.decode(token, { complete: true });
        if (!decodedHeader) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const kid = decodedHeader.header.kid;
        const jwk = jwks.find(key => key.kid === kid);
        
        if (!jwk) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        // Convert JWK to PEM and verify token
        const pem = jwkToPem(jwk);
        const decoded = jwt.verify(token, pem, { algorithms: ['RS256'] });
        
        // Add user info to request
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name || decoded.email || decoded.username
        };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = {
    verifyToken
};

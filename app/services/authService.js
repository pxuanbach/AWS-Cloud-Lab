const AWS = require('aws-sdk');
const axios = require('axios');

// AWS Cognito Identity Service Provider
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION || 'us-east-1'
});

class AuthService {
    
    // Register user with Cognito
    static async registerUser(name, email, password) {
        const cognitoEndpoint = process.env.COGNITO_ENDPOINT || 'http://localhost:9229';
        const clientId = process.env.COGNITO_CLIENT_ID || 'local_client_id';
        
        // Check if using Cognito Local
        const isLocal = cognitoEndpoint.includes('localhost') || cognitoEndpoint.includes('cognito-local');
        
        if (isLocal) {
            // Use Cognito Local
            return this.registerWithCognitoLocal(name, email, password, cognitoEndpoint, clientId);
        } else {
            // Use AWS Cognito
            return this.registerWithAWSCognito(name, email, password, clientId);
        }
    }
    
    // Register with Cognito Local
    static async registerWithCognitoLocal(name, email, password, cognitoEndpoint, clientId) {
        try {
            // Step 1: Sign up user
            const signUpResponse = await axios.post(cognitoEndpoint, {
                ClientId: clientId,
                Username: email,
                Password: password,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email
                    },
                    {
                        Name: 'name',
                        Value: name
                    }
                ]
            }, {
                headers: {
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
                    'Content-Type': 'application/x-amz-json-1.1'
                }
            });
            
            // Step 2: Auto-confirm user
            const userPoolId = process.env.COGNITO_USER_POOL_ID || 'local_pool_id';
            await axios.post(cognitoEndpoint, {
                UserPoolId: userPoolId,
                Username: email
            }, {
                headers: {
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.AdminConfirmSignUp',
                    'Content-Type': 'application/x-amz-json-1.1'
                }
            });
            
            return {
                success: true,
                userSub: signUpResponse.data.UserSub,
                message: 'User registered and confirmed successfully'
            };
            
        } catch (error) {
            console.error('Cognito Local registration error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }
    
    // Register with AWS Cognito
    static async registerWithAWSCognito(name, email, password, clientId) {
        try {
            // Step 1: Sign up user
            const signUpParams = {
                ClientId: clientId,
                Username: email,
                Password: password,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: email
                    },
                    {
                        Name: 'name',
                        Value: name
                    }
                ]
            };
            
            const signUpResult = await cognitoIdentityServiceProvider.signUp(signUpParams).promise();
            
            // Step 2: Auto-confirm user (admin action)
            const userPoolId = process.env.COGNITO_USER_POOL_ID;
            const confirmParams = {
                UserPoolId: userPoolId,
                Username: email
            };
            
            await cognitoIdentityServiceProvider.adminConfirmSignUp(confirmParams).promise();
            
            return {
                success: true,
                userSub: signUpResult.UserSub,
                message: 'User registered and confirmed successfully'
            };
            
        } catch (error) {
            console.error('AWS Cognito registration error:', error);
            
            // Handle specific Cognito errors
            switch (error.code) {
                case 'UsernameExistsException':
                    throw new Error('Tài khoản với email này đã tồn tại.');
                case 'InvalidPasswordException':
                    throw new Error('Mật khẩu không đáp ứng yêu cầu bảo mật.');
                case 'InvalidParameterException':
                    throw new Error('Thông tin đăng ký không hợp lệ.');
                default:
                    throw new Error('Đăng ký thất bại. Vui lòng thử lại.');
            }
        }
    }
    
    // Login user with Cognito
    static async loginUser(email, password) {
        const cognitoEndpoint = process.env.COGNITO_ENDPOINT || 'http://localhost:9229';
        const clientId = process.env.COGNITO_CLIENT_ID || 'local_client_id';
        
        // Check if using Cognito Local
        const isLocal = cognitoEndpoint.includes('localhost') || cognitoEndpoint.includes('cognito-local');
        
        if (isLocal) {
            // Use Cognito Local
            return this.loginWithCognitoLocal(email, password, cognitoEndpoint, clientId);
        } else {
            // Use AWS Cognito
            return this.loginWithAWSCognito(email, password, clientId);
        }
    }
    
    // Login with Cognito Local
    static async loginWithCognitoLocal(email, password, cognitoEndpoint, clientId) {
        try {
            const response = await axios.post(cognitoEndpoint, {
                ClientId: clientId,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password
                }
            }, {
                headers: {
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
                    'Content-Type': 'application/x-amz-json-1.1'
                }
            });
            
            const { AuthenticationResult } = response.data;
            
            if (!AuthenticationResult) {
                throw new Error('Authentication failed');
            }
            
            return {
                accessToken: AuthenticationResult.AccessToken,
                idToken: AuthenticationResult.IdToken,
                refreshToken: AuthenticationResult.RefreshToken,
                user: {
                    email: email,
                    name: email.split('@')[0]
                }
            };
            
        } catch (error) {
            console.error('Cognito Local login error:', error.response?.data || error.message);
            throw new Error('Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.');
        }
    }
    
    // Login with AWS Cognito
    static async loginWithAWSCognito(email, password, clientId) {
        try {
            const params = {
                ClientId: clientId,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password
                }
            };
            
            const response = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
            const { AuthenticationResult } = response;
            
            if (!AuthenticationResult) {
                throw new Error('Authentication failed');
            }
            
            return {
                accessToken: AuthenticationResult.AccessToken,
                idToken: AuthenticationResult.IdToken,
                refreshToken: AuthenticationResult.RefreshToken,
                user: {
                    email: email,
                    name: email.split('@')[0]
                }
            };
            
        } catch (error) {
            console.error('AWS Cognito login error:', error);
            
            // Handle specific Cognito errors
            switch (error.code) {
                case 'NotAuthorizedException':
                    throw new Error('Email hoặc mật khẩu không đúng.');
                case 'UserNotFoundException':
                    throw new Error('Tài khoản không tồn tại.');
                case 'UserNotConfirmedException':
                    throw new Error('Tài khoản chưa được xác thực. Vui lòng kiểm tra email.');
                default:
                    throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
            }
        }
    }
}

module.exports = AuthService;

import RegisteredUserController from './RegisteredUserController'
import SocialAuthController from './SocialAuthController'
const Auth = {
    RegisteredUserController: Object.assign(RegisteredUserController, RegisteredUserController),
SocialAuthController: Object.assign(SocialAuthController, SocialAuthController),
}

export default Auth
import ProfileController from './ProfileController'
import EmailChangeController from './EmailChangeController'
import GoogleAccountController from './GoogleAccountController'
import SecurityController from './SecurityController'
const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
EmailChangeController: Object.assign(EmailChangeController, EmailChangeController),
GoogleAccountController: Object.assign(GoogleAccountController, GoogleAccountController),
SecurityController: Object.assign(SecurityController, SecurityController),
}

export default Settings
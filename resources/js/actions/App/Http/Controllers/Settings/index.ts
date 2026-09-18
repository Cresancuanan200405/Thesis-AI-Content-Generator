import ProfileController from './ProfileController'
import EmailChangeController from './EmailChangeController'
import SecurityController from './SecurityController'
const Settings = {
    ProfileController: Object.assign(ProfileController, ProfileController),
EmailChangeController: Object.assign(EmailChangeController, EmailChangeController),
SecurityController: Object.assign(SecurityController, SecurityController),
}

export default Settings
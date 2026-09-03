import Auth from './Auth'
import OnboardingController from './OnboardingController'
import UserProfileController from './UserProfileController'
import GeneratorController from './GeneratorController'
import DesignController from './DesignController'
import EventController from './EventController'
import CampaignController from './CampaignController'
import ProductController from './ProductController'
import SubscriptionController from './SubscriptionController'
import NotificationController from './NotificationController'
import Settings from './Settings'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
OnboardingController: Object.assign(OnboardingController, OnboardingController),
UserProfileController: Object.assign(UserProfileController, UserProfileController),
GeneratorController: Object.assign(GeneratorController, GeneratorController),
DesignController: Object.assign(DesignController, DesignController),
EventController: Object.assign(EventController, EventController),
CampaignController: Object.assign(CampaignController, CampaignController),
ProductController: Object.assign(ProductController, ProductController),
SubscriptionController: Object.assign(SubscriptionController, SubscriptionController),
NotificationController: Object.assign(NotificationController, NotificationController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers
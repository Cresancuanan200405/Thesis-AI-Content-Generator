import {
    UtensilsCrossed,
    ShoppingCart,
    Shirt,
    Sparkles,
    Home,
    Sprout,
    Palette,
    Plane,
    Car,
    Cpu,
    GraduationCap,
    HeartPulse,
    type LucideIcon,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| Authoritative 12 MSME-Oriented Industry & Category Taxonomy
|--------------------------------------------------------------------------
| MarketPilot supports selected MSME-oriented industries for which AI-generated
| promotional marketing content provides meaningful visual and commercial value.
*/

export const industryCategories: Record<string, string[]> = {
    'Food & Beverage': [
        'Restaurant',
        'Café / Coffee Shop',
        'Bakery / Pastry',
        'Catering',
        'Food Products',
        'Beverage Products',
        'Snacks / Desserts',
    ],
    'Retail & E-Commerce': [
        'General Retail',
        'Online Shop',
        'Specialty Store',
        'Grocery / Convenience',
        'Consumer Products',
    ],
    'Fashion & Apparel': [
        'Clothing',
        'Footwear',
        'Bags & Accessories',
        'Jewelry / Accessories',
        'Local / Handmade Fashion',
    ],
    'Beauty & Personal Care': [
        'Skincare',
        'Cosmetics',
        'Hair Salon / Barbershop',
        'Nail / Beauty Services',
        'Personal Care Products',
    ],
    'Home & Lifestyle': [
        'Furniture',
        'Home Décor',
        'Household Products',
        'Interior / Home Services',
        'Lifestyle Products',
    ],
    'Agriculture & Agribusiness': [
        'Farm Produce',
        'Organic Products',
        'Coffee / Cacao',
        'Meat / Poultry',
        'Seafood',
        'Agricultural Products',
    ],
    'Arts, Crafts & Creative Services': [
        'Handmade Crafts',
        'Souvenirs',
        'Gifts',
        'Printing',
        'Photography / Creative Services',
        'Local Artisan Products',
    ],
    'Tourism & Hospitality': [
        'Hotel / Resort',
        'Homestay',
        'Travel Services',
        'Tour Services',
        'Tourism Attractions',
        'Events / Experiences',
    ],
    'Automotive & Transport Services': [
        'Auto Repair',
        'Motorcycle Services',
        'Car Wash / Detailing',
        'Auto Parts',
        'Transport Services',
    ],
    'Technology & Digital Services': [
        'Computer / Electronics Shop',
        'IT Services',
        'Software / Digital Services',
        'Digital Marketing',
        'Technology Services',
    ],
    'Education & Training': [
        'Tutorial Center',
        'Training Center',
        'Skills Training',
        'Educational Services',
        'Review / Learning Services',
    ],
    'Health, Fitness & Wellness': [
        'Fitness / Gym',
        'Wellness Services',
        'Massage / Spa',
        'Health Products',
        'Clinic / Health Services',
    ],
};

export const industryOptions = Object.keys(industryCategories);

export const industryIcons: Record<string, LucideIcon> = {
    'Food & Beverage': UtensilsCrossed,
    'Retail & E-Commerce': ShoppingCart,
    'Fashion & Apparel': Shirt,
    'Beauty & Personal Care': Sparkles,
    'Home & Lifestyle': Home,
    'Agriculture & Agribusiness': Sprout,
    'Arts, Crafts & Creative Services': Palette,
    'Tourism & Hospitality': Plane,
    'Automotive & Transport Services': Car,
    'Technology & Digital Services': Cpu,
    'Education & Training': GraduationCap,
    'Health, Fitness & Wellness': HeartPulse,
};

export function getCategoriesForIndustry(industry: string): string[] {
    return industryCategories[industry] || [];
}

export function isValidIndustry(industry: string): boolean {
    return Object.prototype.hasOwnProperty.call(industryCategories, industry);
}

export function isValidCategory(industry: string, category: string): boolean {
    const categories = getCategoriesForIndustry(industry);
    return categories.includes(category);
}

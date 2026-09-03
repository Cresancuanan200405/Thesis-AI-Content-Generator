import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/onboarding',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OnboardingController::show
 * @see app/Http/Controllers/OnboardingController.php:13
 * @route '/onboarding'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\OnboardingController::business
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
export const business = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: business.url(options),
    method: 'post',
})

business.definition = {
    methods: ["post"],
    url: '/onboarding/business',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OnboardingController::business
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
business.url = (options?: RouteQueryOptions) => {
    return business.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OnboardingController::business
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
business.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: business.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OnboardingController::business
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
    const businessForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: business.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OnboardingController::business
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
        businessForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: business.url(options),
            method: 'post',
        })
    
    business.form = businessForm
/**
* @see \App\Http\Controllers\OnboardingController::preferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
export const preferences = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preferences.url(options),
    method: 'post',
})

preferences.definition = {
    methods: ["post"],
    url: '/onboarding/preferences',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OnboardingController::preferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
preferences.url = (options?: RouteQueryOptions) => {
    return preferences.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OnboardingController::preferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
preferences.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preferences.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OnboardingController::preferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
    const preferencesForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: preferences.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OnboardingController::preferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
        preferencesForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: preferences.url(options),
            method: 'post',
        })
    
    preferences.form = preferencesForm
/**
* @see \App\Http\Controllers\OnboardingController::complete
 * @see app/Http/Controllers/OnboardingController.php:59
 * @route '/onboarding/complete'
 */
export const complete = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: complete.url(options),
    method: 'post',
})

complete.definition = {
    methods: ["post"],
    url: '/onboarding/complete',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OnboardingController::complete
 * @see app/Http/Controllers/OnboardingController.php:59
 * @route '/onboarding/complete'
 */
complete.url = (options?: RouteQueryOptions) => {
    return complete.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OnboardingController::complete
 * @see app/Http/Controllers/OnboardingController.php:59
 * @route '/onboarding/complete'
 */
complete.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: complete.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OnboardingController::complete
 * @see app/Http/Controllers/OnboardingController.php:59
 * @route '/onboarding/complete'
 */
    const completeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: complete.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OnboardingController::complete
 * @see app/Http/Controllers/OnboardingController.php:59
 * @route '/onboarding/complete'
 */
        completeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: complete.url(options),
            method: 'post',
        })
    
    complete.form = completeForm
const onboarding = {
    show: Object.assign(show, show),
business: Object.assign(business, business),
preferences: Object.assign(preferences, preferences),
complete: Object.assign(complete, complete),
}

export default onboarding
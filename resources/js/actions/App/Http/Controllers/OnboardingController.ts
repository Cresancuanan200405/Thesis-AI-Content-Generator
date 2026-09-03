import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\OnboardingController::saveBusiness
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
export const saveBusiness = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: saveBusiness.url(options),
    method: 'post',
})

saveBusiness.definition = {
    methods: ["post"],
    url: '/onboarding/business',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OnboardingController::saveBusiness
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
saveBusiness.url = (options?: RouteQueryOptions) => {
    return saveBusiness.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OnboardingController::saveBusiness
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
saveBusiness.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: saveBusiness.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OnboardingController::saveBusiness
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
    const saveBusinessForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: saveBusiness.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OnboardingController::saveBusiness
 * @see app/Http/Controllers/OnboardingController.php:45
 * @route '/onboarding/business'
 */
        saveBusinessForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: saveBusiness.url(options),
            method: 'post',
        })
    
    saveBusiness.form = saveBusinessForm
/**
* @see \App\Http\Controllers\OnboardingController::savePreferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
export const savePreferences = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: savePreferences.url(options),
    method: 'post',
})

savePreferences.definition = {
    methods: ["post"],
    url: '/onboarding/preferences',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OnboardingController::savePreferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
savePreferences.url = (options?: RouteQueryOptions) => {
    return savePreferences.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OnboardingController::savePreferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
savePreferences.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: savePreferences.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OnboardingController::savePreferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
    const savePreferencesForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: savePreferences.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OnboardingController::savePreferences
 * @see app/Http/Controllers/OnboardingController.php:0
 * @route '/onboarding/preferences'
 */
        savePreferencesForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: savePreferences.url(options),
            method: 'post',
        })
    
    savePreferences.form = savePreferencesForm
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
const OnboardingController = { show, saveBusiness, savePreferences, complete }

export default OnboardingController
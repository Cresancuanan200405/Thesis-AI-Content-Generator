import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post","patch"],
    url: '/profile/business',
} satisfies RouteDefinition<["post","patch"]>

/**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\UserProfileController::update
 * @see app/Http/Controllers/UserProfileController.php:87
 * @route '/profile/business'
 */
        updateForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
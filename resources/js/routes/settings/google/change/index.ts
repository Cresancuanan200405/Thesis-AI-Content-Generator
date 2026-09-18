import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/settings/google/change/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
    const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: callback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
        callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::callback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
        callbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    callback.form = callbackForm
const change = {
    callback: Object.assign(callback, callback),
}

export default change
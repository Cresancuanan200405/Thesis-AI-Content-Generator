import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/settings/email/verify/google/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
    const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: callback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
        callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::callback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
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
const google = {
    callback: Object.assign(callback, callback),
}

export default google
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
import google723582 from './google'
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
export const google = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: google.url(options),
    method: 'get',
})

google.definition = {
    methods: ["get","head"],
    url: '/settings/email/verify/google',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
google.url = (options?: RouteQueryOptions) => {
    return google.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
google.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: google.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
google.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: google.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
    const googleForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: google.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
        googleForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: google.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::google
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
        googleForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: google.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    google.form = googleForm
const verify = {
    google: Object.assign(google, google723582),
}

export default verify
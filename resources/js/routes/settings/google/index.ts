import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
import verifyCurrent9f3211 from './verify-current'
import change8775ba from './change'
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
export const verifyCurrent = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verifyCurrent.url(options),
    method: 'get',
})

verifyCurrent.definition = {
    methods: ["get","head"],
    url: '/settings/google/verify-current',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
verifyCurrent.url = (options?: RouteQueryOptions) => {
    return verifyCurrent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
verifyCurrent.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verifyCurrent.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
verifyCurrent.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verifyCurrent.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
    const verifyCurrentForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verifyCurrent.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
        verifyCurrentForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verifyCurrent.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrent
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
        verifyCurrentForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verifyCurrent.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verifyCurrent.form = verifyCurrentForm
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyPassword
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:139
 * @route '/settings/google/verify-password'
 */
export const verifyPassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyPassword.url(options),
    method: 'post',
})

verifyPassword.definition = {
    methods: ["post"],
    url: '/settings/google/verify-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyPassword
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:139
 * @route '/settings/google/verify-password'
 */
verifyPassword.url = (options?: RouteQueryOptions) => {
    return verifyPassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyPassword
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:139
 * @route '/settings/google/verify-password'
 */
verifyPassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyPassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyPassword
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:139
 * @route '/settings/google/verify-password'
 */
    const verifyPasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verifyPassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyPassword
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:139
 * @route '/settings/google/verify-password'
 */
        verifyPasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verifyPassword.url(options),
            method: 'post',
        })
    
    verifyPassword.form = verifyPasswordForm
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
export const change = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: change.url(options),
    method: 'get',
})

change.definition = {
    methods: ["get","head"],
    url: '/settings/google/change',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
change.url = (options?: RouteQueryOptions) => {
    return change.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
change.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: change.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
change.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: change.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
    const changeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: change.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
        changeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: change.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::change
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
        changeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: change.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    change.form = changeForm
const google = {
    verifyCurrent: Object.assign(verifyCurrent, verifyCurrent9f3211),
verifyPassword: Object.assign(verifyPassword, verifyPassword),
change: Object.assign(change, change8775ba),
}

export default google
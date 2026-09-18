import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
export const verifyCurrentAccount = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verifyCurrentAccount.url(options),
    method: 'get',
})

verifyCurrentAccount.definition = {
    methods: ["get","head"],
    url: '/settings/google/verify-current',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
verifyCurrentAccount.url = (options?: RouteQueryOptions) => {
    return verifyCurrentAccount.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
verifyCurrentAccount.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: verifyCurrentAccount.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
verifyCurrentAccount.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: verifyCurrentAccount.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
    const verifyCurrentAccountForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: verifyCurrentAccount.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
        verifyCurrentAccountForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verifyCurrentAccount.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::verifyCurrentAccount
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:27
 * @route '/settings/google/verify-current'
 */
        verifyCurrentAccountForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: verifyCurrentAccount.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    verifyCurrentAccount.form = verifyCurrentAccountForm
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
export const handleVerifyCurrentCallback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleVerifyCurrentCallback.url(options),
    method: 'get',
})

handleVerifyCurrentCallback.definition = {
    methods: ["get","head"],
    url: '/settings/google/verify-current/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
handleVerifyCurrentCallback.url = (options?: RouteQueryOptions) => {
    return handleVerifyCurrentCallback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
handleVerifyCurrentCallback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleVerifyCurrentCallback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
handleVerifyCurrentCallback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: handleVerifyCurrentCallback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
    const handleVerifyCurrentCallbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: handleVerifyCurrentCallback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
        handleVerifyCurrentCallbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: handleVerifyCurrentCallback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleVerifyCurrentCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:65
 * @route '/settings/google/verify-current/callback'
 */
        handleVerifyCurrentCallbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: handleVerifyCurrentCallback.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    handleVerifyCurrentCallback.form = handleVerifyCurrentCallbackForm
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
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
export const redirectToNewGoogle = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToNewGoogle.url(options),
    method: 'get',
})

redirectToNewGoogle.definition = {
    methods: ["get","head"],
    url: '/settings/google/change',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
redirectToNewGoogle.url = (options?: RouteQueryOptions) => {
    return redirectToNewGoogle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
redirectToNewGoogle.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToNewGoogle.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
redirectToNewGoogle.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: redirectToNewGoogle.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
    const redirectToNewGoogleForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: redirectToNewGoogle.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
        redirectToNewGoogleForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: redirectToNewGoogle.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::redirectToNewGoogle
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:173
 * @route '/settings/google/change'
 */
        redirectToNewGoogleForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: redirectToNewGoogle.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    redirectToNewGoogle.form = redirectToNewGoogleForm
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
export const handleNewGoogleCallback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleNewGoogleCallback.url(options),
    method: 'get',
})

handleNewGoogleCallback.definition = {
    methods: ["get","head"],
    url: '/settings/google/change/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
handleNewGoogleCallback.url = (options?: RouteQueryOptions) => {
    return handleNewGoogleCallback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
handleNewGoogleCallback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleNewGoogleCallback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
handleNewGoogleCallback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: handleNewGoogleCallback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
    const handleNewGoogleCallbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: handleNewGoogleCallback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
        handleNewGoogleCallbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: handleNewGoogleCallback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\GoogleAccountController::handleNewGoogleCallback
 * @see app/Http/Controllers/Settings/GoogleAccountController.php:211
 * @route '/settings/google/change/callback'
 */
        handleNewGoogleCallbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: handleNewGoogleCallback.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    handleNewGoogleCallback.form = handleNewGoogleCallbackForm
const GoogleAccountController = { verifyCurrentAccount, handleVerifyCurrentCallback, verifyPassword, redirectToNewGoogle, handleNewGoogleCallback }

export default GoogleAccountController
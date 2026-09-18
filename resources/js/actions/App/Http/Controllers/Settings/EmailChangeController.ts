import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
export const redirectToGoogle = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToGoogle.url(options),
    method: 'get',
})

redirectToGoogle.definition = {
    methods: ["get","head"],
    url: '/settings/email/verify/google',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
redirectToGoogle.url = (options?: RouteQueryOptions) => {
    return redirectToGoogle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
redirectToGoogle.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirectToGoogle.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
redirectToGoogle.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: redirectToGoogle.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
    const redirectToGoogleForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: redirectToGoogle.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
        redirectToGoogleForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: redirectToGoogle.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::redirectToGoogle
 * @see app/Http/Controllers/Settings/EmailChangeController.php:28
 * @route '/settings/email/verify/google'
 */
        redirectToGoogleForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: redirectToGoogle.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    redirectToGoogle.form = redirectToGoogleForm
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
export const handleGoogleCallback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleGoogleCallback.url(options),
    method: 'get',
})

handleGoogleCallback.definition = {
    methods: ["get","head"],
    url: '/settings/email/verify/google/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
handleGoogleCallback.url = (options?: RouteQueryOptions) => {
    return handleGoogleCallback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
handleGoogleCallback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: handleGoogleCallback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
handleGoogleCallback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: handleGoogleCallback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
    const handleGoogleCallbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: handleGoogleCallback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
        handleGoogleCallbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: handleGoogleCallback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::handleGoogleCallback
 * @see app/Http/Controllers/Settings/EmailChangeController.php:66
 * @route '/settings/email/verify/google/callback'
 */
        handleGoogleCallbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: handleGoogleCallback.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    handleGoogleCallback.form = handleGoogleCallbackForm
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::verifyIdentity
 * @see app/Http/Controllers/Settings/EmailChangeController.php:142
 * @route '/settings/email/verify-identity'
 */
export const verifyIdentity = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyIdentity.url(options),
    method: 'post',
})

verifyIdentity.definition = {
    methods: ["post"],
    url: '/settings/email/verify-identity',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::verifyIdentity
 * @see app/Http/Controllers/Settings/EmailChangeController.php:142
 * @route '/settings/email/verify-identity'
 */
verifyIdentity.url = (options?: RouteQueryOptions) => {
    return verifyIdentity.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::verifyIdentity
 * @see app/Http/Controllers/Settings/EmailChangeController.php:142
 * @route '/settings/email/verify-identity'
 */
verifyIdentity.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyIdentity.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::verifyIdentity
 * @see app/Http/Controllers/Settings/EmailChangeController.php:142
 * @route '/settings/email/verify-identity'
 */
    const verifyIdentityForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verifyIdentity.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::verifyIdentity
 * @see app/Http/Controllers/Settings/EmailChangeController.php:142
 * @route '/settings/email/verify-identity'
 */
        verifyIdentityForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verifyIdentity.url(options),
            method: 'post',
        })
    
    verifyIdentity.form = verifyIdentityForm
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::requestChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:214
 * @route '/settings/email/request-change'
 */
export const requestChange = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestChange.url(options),
    method: 'post',
})

requestChange.definition = {
    methods: ["post"],
    url: '/settings/email/request-change',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::requestChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:214
 * @route '/settings/email/request-change'
 */
requestChange.url = (options?: RouteQueryOptions) => {
    return requestChange.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::requestChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:214
 * @route '/settings/email/request-change'
 */
requestChange.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: requestChange.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::requestChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:214
 * @route '/settings/email/request-change'
 */
    const requestChangeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: requestChange.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::requestChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:214
 * @route '/settings/email/request-change'
 */
        requestChangeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: requestChange.url(options),
            method: 'post',
        })
    
    requestChange.form = requestChangeForm
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::confirmChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:272
 * @route '/settings/email/confirm-change'
 */
export const confirmChange = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmChange.url(options),
    method: 'post',
})

confirmChange.definition = {
    methods: ["post"],
    url: '/settings/email/confirm-change',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::confirmChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:272
 * @route '/settings/email/confirm-change'
 */
confirmChange.url = (options?: RouteQueryOptions) => {
    return confirmChange.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::confirmChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:272
 * @route '/settings/email/confirm-change'
 */
confirmChange.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirmChange.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::confirmChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:272
 * @route '/settings/email/confirm-change'
 */
    const confirmChangeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: confirmChange.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::confirmChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:272
 * @route '/settings/email/confirm-change'
 */
        confirmChangeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: confirmChange.url(options),
            method: 'post',
        })
    
    confirmChange.form = confirmChangeForm
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::resendCode
 * @see app/Http/Controllers/Settings/EmailChangeController.php:344
 * @route '/settings/email/resend-code'
 */
export const resendCode = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resendCode.url(options),
    method: 'post',
})

resendCode.definition = {
    methods: ["post"],
    url: '/settings/email/resend-code',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::resendCode
 * @see app/Http/Controllers/Settings/EmailChangeController.php:344
 * @route '/settings/email/resend-code'
 */
resendCode.url = (options?: RouteQueryOptions) => {
    return resendCode.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::resendCode
 * @see app/Http/Controllers/Settings/EmailChangeController.php:344
 * @route '/settings/email/resend-code'
 */
resendCode.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resendCode.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::resendCode
 * @see app/Http/Controllers/Settings/EmailChangeController.php:344
 * @route '/settings/email/resend-code'
 */
    const resendCodeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resendCode.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::resendCode
 * @see app/Http/Controllers/Settings/EmailChangeController.php:344
 * @route '/settings/email/resend-code'
 */
        resendCodeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resendCode.url(options),
            method: 'post',
        })
    
    resendCode.form = resendCodeForm
/**
* @see \App\Http\Controllers\Settings\EmailChangeController::cancelChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:389
 * @route '/settings/email/cancel-change'
 */
export const cancelChange = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: cancelChange.url(options),
    method: 'delete',
})

cancelChange.definition = {
    methods: ["delete"],
    url: '/settings/email/cancel-change',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::cancelChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:389
 * @route '/settings/email/cancel-change'
 */
cancelChange.url = (options?: RouteQueryOptions) => {
    return cancelChange.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EmailChangeController::cancelChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:389
 * @route '/settings/email/cancel-change'
 */
cancelChange.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: cancelChange.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\EmailChangeController::cancelChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:389
 * @route '/settings/email/cancel-change'
 */
    const cancelChangeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelChange.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EmailChangeController::cancelChange
 * @see app/Http/Controllers/Settings/EmailChangeController.php:389
 * @route '/settings/email/cancel-change'
 */
        cancelChangeForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelChange.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    cancelChange.form = cancelChangeForm
const EmailChangeController = { redirectToGoogle, handleGoogleCallback, verifyIdentity, requestChange, confirmChange, resendCode, cancelChange }

export default EmailChangeController
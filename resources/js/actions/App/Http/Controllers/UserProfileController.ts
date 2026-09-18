import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/profile',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserProfileController::show
 * @see app/Http/Controllers/UserProfileController.php:22
 * @route '/profile'
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
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
export const updateBusiness = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateBusiness.url(options),
    method: 'post',
})

updateBusiness.definition = {
    methods: ["post","patch"],
    url: '/profile/business',
} satisfies RouteDefinition<["post","patch"]>

/**
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
updateBusiness.url = (options?: RouteQueryOptions) => {
    return updateBusiness.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
updateBusiness.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateBusiness.url(options),
    method: 'post',
})
/**
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
updateBusiness.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateBusiness.url(options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
    const updateBusinessForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateBusiness.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
        updateBusinessForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateBusiness.url(options),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\UserProfileController::updateBusiness
 * @see app/Http/Controllers/UserProfileController.php:106
 * @route '/profile/business'
 */
        updateBusinessForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateBusiness.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateBusiness.form = updateBusinessForm
/**
* @see \App\Http\Controllers\UserProfileController::storeBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:128
 * @route '/profile/business/document'
 */
export const storeBusinessDocument = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBusinessDocument.url(options),
    method: 'post',
})

storeBusinessDocument.definition = {
    methods: ["post"],
    url: '/profile/business/document',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserProfileController::storeBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:128
 * @route '/profile/business/document'
 */
storeBusinessDocument.url = (options?: RouteQueryOptions) => {
    return storeBusinessDocument.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::storeBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:128
 * @route '/profile/business/document'
 */
storeBusinessDocument.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBusinessDocument.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserProfileController::storeBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:128
 * @route '/profile/business/document'
 */
    const storeBusinessDocumentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeBusinessDocument.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::storeBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:128
 * @route '/profile/business/document'
 */
        storeBusinessDocumentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeBusinessDocument.url(options),
            method: 'post',
        })
    
    storeBusinessDocument.form = storeBusinessDocumentForm
/**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
export const downloadBusinessDocument = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadBusinessDocument.url(options),
    method: 'get',
})

downloadBusinessDocument.definition = {
    methods: ["get","head"],
    url: '/profile/business/document',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
downloadBusinessDocument.url = (options?: RouteQueryOptions) => {
    return downloadBusinessDocument.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
downloadBusinessDocument.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadBusinessDocument.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
downloadBusinessDocument.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadBusinessDocument.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
    const downloadBusinessDocumentForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: downloadBusinessDocument.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
        downloadBusinessDocumentForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadBusinessDocument.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserProfileController::downloadBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:169
 * @route '/profile/business/document'
 */
        downloadBusinessDocumentForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadBusinessDocument.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    downloadBusinessDocument.form = downloadBusinessDocumentForm
/**
* @see \App\Http\Controllers\UserProfileController::deleteBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:185
 * @route '/profile/business/document'
 */
export const deleteBusinessDocument = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteBusinessDocument.url(options),
    method: 'delete',
})

deleteBusinessDocument.definition = {
    methods: ["delete"],
    url: '/profile/business/document',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserProfileController::deleteBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:185
 * @route '/profile/business/document'
 */
deleteBusinessDocument.url = (options?: RouteQueryOptions) => {
    return deleteBusinessDocument.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::deleteBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:185
 * @route '/profile/business/document'
 */
deleteBusinessDocument.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteBusinessDocument.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserProfileController::deleteBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:185
 * @route '/profile/business/document'
 */
    const deleteBusinessDocumentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deleteBusinessDocument.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::deleteBusinessDocument
 * @see app/Http/Controllers/UserProfileController.php:185
 * @route '/profile/business/document'
 */
        deleteBusinessDocumentForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deleteBusinessDocument.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    deleteBusinessDocument.form = deleteBusinessDocumentForm
/**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
export const showBusiness = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showBusiness.url(options),
    method: 'get',
})

showBusiness.definition = {
    methods: ["get","head"],
    url: '/profile/business',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
showBusiness.url = (options?: RouteQueryOptions) => {
    return showBusiness.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
showBusiness.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showBusiness.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
showBusiness.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showBusiness.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
    const showBusinessForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showBusiness.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
        showBusinessForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showBusiness.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserProfileController::showBusiness
 * @see app/Http/Controllers/UserProfileController.php:67
 * @route '/profile/business'
 */
        showBusinessForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showBusiness.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showBusiness.form = showBusinessForm
const UserProfileController = { show, updateBusiness, storeBusinessDocument, downloadBusinessDocument, deleteBusinessDocument, showBusiness }

export default UserProfileController
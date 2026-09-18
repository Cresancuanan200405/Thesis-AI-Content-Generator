import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UserProfileController::store
 * @see app/Http/Controllers/UserProfileController.php:130
 * @route '/profile/business/document'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/profile/business/document',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserProfileController::store
 * @see app/Http/Controllers/UserProfileController.php:130
 * @route '/profile/business/document'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::store
 * @see app/Http/Controllers/UserProfileController.php:130
 * @route '/profile/business/document'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\UserProfileController::store
 * @see app/Http/Controllers/UserProfileController.php:130
 * @route '/profile/business/document'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::store
 * @see app/Http/Controllers/UserProfileController.php:130
 * @route '/profile/business/document'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
export const download = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/profile/business/document',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
download.url = (options?: RouteQueryOptions) => {
    return download.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
download.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
download.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
    const downloadForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: download.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
        downloadForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\UserProfileController::download
 * @see app/Http/Controllers/UserProfileController.php:171
 * @route '/profile/business/document'
 */
        downloadForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    download.form = downloadForm
/**
* @see \App\Http\Controllers\UserProfileController::deleteMethod
 * @see app/Http/Controllers/UserProfileController.php:187
 * @route '/profile/business/document'
 */
export const deleteMethod = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(options),
    method: 'delete',
})

deleteMethod.definition = {
    methods: ["delete"],
    url: '/profile/business/document',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserProfileController::deleteMethod
 * @see app/Http/Controllers/UserProfileController.php:187
 * @route '/profile/business/document'
 */
deleteMethod.url = (options?: RouteQueryOptions) => {
    return deleteMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\UserProfileController::deleteMethod
 * @see app/Http/Controllers/UserProfileController.php:187
 * @route '/profile/business/document'
 */
deleteMethod.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\UserProfileController::deleteMethod
 * @see app/Http/Controllers/UserProfileController.php:187
 * @route '/profile/business/document'
 */
    const deleteMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: deleteMethod.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\UserProfileController::deleteMethod
 * @see app/Http/Controllers/UserProfileController.php:187
 * @route '/profile/business/document'
 */
        deleteMethodForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: deleteMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    deleteMethod.form = deleteMethodForm
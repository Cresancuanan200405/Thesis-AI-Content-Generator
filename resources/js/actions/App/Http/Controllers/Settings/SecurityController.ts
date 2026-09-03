import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
export const edit = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/settings/security',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
edit.url = (options?: RouteQueryOptions) => {
    return edit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
edit.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
edit.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
    const editForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
        editForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SecurityController::edit
 * @see app/Http/Controllers/Settings/SecurityController.php:26
 * @route '/settings/security'
 */
        editForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\Settings\SecurityController::update
 * @see app/Http/Controllers/Settings/SecurityController.php:47
 * @route '/settings/password'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/password',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\SecurityController::update
 * @see app/Http/Controllers/Settings/SecurityController.php:47
 * @route '/settings/password'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SecurityController::update
 * @see app/Http/Controllers/Settings/SecurityController.php:47
 * @route '/settings/password'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\SecurityController::update
 * @see app/Http/Controllers/Settings/SecurityController.php:47
 * @route '/settings/password'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SecurityController::update
 * @see app/Http/Controllers/Settings/SecurityController.php:47
 * @route '/settings/password'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Settings\SecurityController::destroyOtherSessions
 * @see app/Http/Controllers/Settings/SecurityController.php:68
 * @route '/settings/sessions'
 */
export const destroyOtherSessions = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyOtherSessions.url(options),
    method: 'delete',
})

destroyOtherSessions.definition = {
    methods: ["delete"],
    url: '/settings/sessions',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\SecurityController::destroyOtherSessions
 * @see app/Http/Controllers/Settings/SecurityController.php:68
 * @route '/settings/sessions'
 */
destroyOtherSessions.url = (options?: RouteQueryOptions) => {
    return destroyOtherSessions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SecurityController::destroyOtherSessions
 * @see app/Http/Controllers/Settings/SecurityController.php:68
 * @route '/settings/sessions'
 */
destroyOtherSessions.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyOtherSessions.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\SecurityController::destroyOtherSessions
 * @see app/Http/Controllers/Settings/SecurityController.php:68
 * @route '/settings/sessions'
 */
    const destroyOtherSessionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroyOtherSessions.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SecurityController::destroyOtherSessions
 * @see app/Http/Controllers/Settings/SecurityController.php:68
 * @route '/settings/sessions'
 */
        destroyOtherSessionsForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroyOtherSessions.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroyOtherSessions.form = destroyOtherSessionsForm
const SecurityController = { edit, update, destroyOtherSessions }

export default SecurityController
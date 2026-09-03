import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/designs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DesignController::index
 * @see app/Http/Controllers/DesignController.php:31
 * @route '/designs'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\DesignController::store
 * @see app/Http/Controllers/DesignController.php:186
 * @route '/designs'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/designs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::store
 * @see app/Http/Controllers/DesignController.php:186
 * @route '/designs'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::store
 * @see app/Http/Controllers/DesignController.php:186
 * @route '/designs'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::store
 * @see app/Http/Controllers/DesignController.php:186
 * @route '/designs'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::store
 * @see app/Http/Controllers/DesignController.php:186
 * @route '/designs'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\DesignController::bulkDelete
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
export const bulkDelete = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDelete.url(options),
    method: 'post',
})

bulkDelete.definition = {
    methods: ["post"],
    url: '/designs/bulk-delete',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::bulkDelete
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
bulkDelete.url = (options?: RouteQueryOptions) => {
    return bulkDelete.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::bulkDelete
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
bulkDelete.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDelete.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::bulkDelete
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
    const bulkDeleteForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDelete.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::bulkDelete
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
        bulkDeleteForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDelete.url(options),
            method: 'post',
        })
    
    bulkDelete.form = bulkDeleteForm
/**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
export const show = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/designs/{design}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
show.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return show.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
show.get = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
show.head = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
    const showForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
        showForm.get = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DesignController::show
 * @see app/Http/Controllers/DesignController.php:418
 * @route '/designs/{design}'
 */
        showForm.head = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\DesignController::favorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
export const favorite = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: favorite.url(args, options),
    method: 'post',
})

favorite.definition = {
    methods: ["post"],
    url: '/designs/{design}/favorite',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::favorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
favorite.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return favorite.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::favorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
favorite.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: favorite.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::favorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
    const favoriteForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: favorite.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::favorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
        favoriteForm.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: favorite.url(args, options),
            method: 'post',
        })
    
    favorite.form = favoriteForm
/**
* @see \App\Http\Controllers\DesignController::attachCampaign
 * @see app/Http/Controllers/DesignController.php:353
 * @route '/designs/{design}/attach-campaign'
 */
export const attachCampaign = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: attachCampaign.url(args, options),
    method: 'post',
})

attachCampaign.definition = {
    methods: ["post"],
    url: '/designs/{design}/attach-campaign',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::attachCampaign
 * @see app/Http/Controllers/DesignController.php:353
 * @route '/designs/{design}/attach-campaign'
 */
attachCampaign.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return attachCampaign.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::attachCampaign
 * @see app/Http/Controllers/DesignController.php:353
 * @route '/designs/{design}/attach-campaign'
 */
attachCampaign.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: attachCampaign.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::attachCampaign
 * @see app/Http/Controllers/DesignController.php:353
 * @route '/designs/{design}/attach-campaign'
 */
    const attachCampaignForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: attachCampaign.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::attachCampaign
 * @see app/Http/Controllers/DesignController.php:353
 * @route '/designs/{design}/attach-campaign'
 */
        attachCampaignForm.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: attachCampaign.url(args, options),
            method: 'post',
        })
    
    attachCampaign.form = attachCampaignForm
/**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
export const download = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/designs/{design}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
download.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return download.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
download.get = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
download.head = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
    const downloadForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: download.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
        downloadForm.get = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\DesignController::download
 * @see app/Http/Controllers/DesignController.php:446
 * @route '/designs/{design}/download'
 */
        downloadForm.head = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    download.form = downloadForm
/**
* @see \App\Http\Controllers\DesignController::regenerate
 * @see app/Http/Controllers/DesignController.php:460
 * @route '/designs/{design}/regenerate'
 */
export const regenerate = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: regenerate.url(args, options),
    method: 'post',
})

regenerate.definition = {
    methods: ["post"],
    url: '/designs/{design}/regenerate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::regenerate
 * @see app/Http/Controllers/DesignController.php:460
 * @route '/designs/{design}/regenerate'
 */
regenerate.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return regenerate.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::regenerate
 * @see app/Http/Controllers/DesignController.php:460
 * @route '/designs/{design}/regenerate'
 */
regenerate.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: regenerate.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::regenerate
 * @see app/Http/Controllers/DesignController.php:460
 * @route '/designs/{design}/regenerate'
 */
    const regenerateForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: regenerate.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::regenerate
 * @see app/Http/Controllers/DesignController.php:460
 * @route '/designs/{design}/regenerate'
 */
        regenerateForm.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: regenerate.url(args, options),
            method: 'post',
        })
    
    regenerate.form = regenerateForm
/**
* @see \App\Http\Controllers\DesignController::destroy
 * @see app/Http/Controllers/DesignController.php:480
 * @route '/designs/{design}'
 */
export const destroy = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/designs/{design}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\DesignController::destroy
 * @see app/Http/Controllers/DesignController.php:480
 * @route '/designs/{design}'
 */
destroy.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return destroy.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::destroy
 * @see app/Http/Controllers/DesignController.php:480
 * @route '/designs/{design}'
 */
destroy.delete = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\DesignController::destroy
 * @see app/Http/Controllers/DesignController.php:480
 * @route '/designs/{design}'
 */
    const destroyForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::destroy
 * @see app/Http/Controllers/DesignController.php:480
 * @route '/designs/{design}'
 */
        destroyForm.delete = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const designs = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
bulkDelete: Object.assign(bulkDelete, bulkDelete),
show: Object.assign(show, show),
favorite: Object.assign(favorite, favorite),
attachCampaign: Object.assign(attachCampaign, attachCampaign),
download: Object.assign(download, download),
regenerate: Object.assign(regenerate, regenerate),
destroy: Object.assign(destroy, destroy),
}

export default designs
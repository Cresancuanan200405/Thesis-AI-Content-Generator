import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\DesignController::bulkDestroy
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
export const bulkDestroy = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDestroy.url(options),
    method: 'post',
})

bulkDestroy.definition = {
    methods: ["post"],
    url: '/designs/bulk-delete',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::bulkDestroy
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
bulkDestroy.url = (options?: RouteQueryOptions) => {
    return bulkDestroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::bulkDestroy
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
bulkDestroy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDestroy.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::bulkDestroy
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
    const bulkDestroyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDestroy.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::bulkDestroy
 * @see app/Http/Controllers/DesignController.php:493
 * @route '/designs/bulk-delete'
 */
        bulkDestroyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDestroy.url(options),
            method: 'post',
        })
    
    bulkDestroy.form = bulkDestroyForm
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
* @see \App\Http\Controllers\DesignController::toggleFavorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
export const toggleFavorite = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleFavorite.url(args, options),
    method: 'post',
})

toggleFavorite.definition = {
    methods: ["post"],
    url: '/designs/{design}/favorite',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\DesignController::toggleFavorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
toggleFavorite.url = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return toggleFavorite.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\DesignController::toggleFavorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
toggleFavorite.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleFavorite.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\DesignController::toggleFavorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
    const toggleFavoriteForm = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleFavorite.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\DesignController::toggleFavorite
 * @see app/Http/Controllers/DesignController.php:399
 * @route '/designs/{design}/favorite'
 */
        toggleFavoriteForm.post = (args: { design: number | { id: number } } | [design: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleFavorite.url(args, options),
            method: 'post',
        })
    
    toggleFavorite.form = toggleFavoriteForm
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
const DesignController = { index, store, bulkDestroy, show, toggleFavorite, attachCampaign, download, regenerate, destroy }

export default DesignController
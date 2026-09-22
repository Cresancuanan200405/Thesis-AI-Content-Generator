import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/campaigns',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CampaignController::index
 * @see app/Http/Controllers/CampaignController.php:22
 * @route '/campaigns'
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
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/campaigns/create',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:322
 * @route '/campaigns/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\CampaignController::store
 * @see app/Http/Controllers/CampaignController.php:318
 * @route '/campaigns'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/campaigns',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CampaignController::store
 * @see app/Http/Controllers/CampaignController.php:318
 * @route '/campaigns'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::store
 * @see app/Http/Controllers/CampaignController.php:318
 * @route '/campaigns'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CampaignController::store
 * @see app/Http/Controllers/CampaignController.php:318
 * @route '/campaigns'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CampaignController::store
 * @see app/Http/Controllers/CampaignController.php:318
 * @route '/campaigns'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
export const show = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/campaigns/{campaign}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
show.url = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { campaign: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: typeof args.campaign === 'object'
                ? args.campaign.id
                : args.campaign,
                }

    return show.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
show.get = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
show.head = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
    const showForm = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
        showForm.get = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CampaignController::show
 * @see app/Http/Controllers/CampaignController.php:215
 * @route '/campaigns/{campaign}'
 */
        showForm.head = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
export const generator = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: generator.url(args, options),
    method: 'get',
})

generator.definition = {
    methods: ["get","head"],
    url: '/campaigns/{campaign}/generator',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
generator.url = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: args.campaign,
                }

    return generator.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
generator.get = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: generator.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
generator.head = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: generator.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
    const generatorForm = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: generator.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
        generatorForm.get = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: generator.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\GeneratorController::generator
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
        generatorForm.head = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: generator.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    generator.form = generatorForm
/**
* @see \App\Http\Controllers\CampaignController::attachDesigns
 * @see app/Http/Controllers/CampaignController.php:288
 * @route '/campaigns/{campaign}/attach-designs'
 */
export const attachDesigns = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: attachDesigns.url(args, options),
    method: 'post',
})

attachDesigns.definition = {
    methods: ["post"],
    url: '/campaigns/{campaign}/attach-designs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CampaignController::attachDesigns
 * @see app/Http/Controllers/CampaignController.php:288
 * @route '/campaigns/{campaign}/attach-designs'
 */
attachDesigns.url = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { campaign: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: typeof args.campaign === 'object'
                ? args.campaign.id
                : args.campaign,
                }

    return attachDesigns.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::attachDesigns
 * @see app/Http/Controllers/CampaignController.php:288
 * @route '/campaigns/{campaign}/attach-designs'
 */
attachDesigns.post = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: attachDesigns.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CampaignController::attachDesigns
 * @see app/Http/Controllers/CampaignController.php:288
 * @route '/campaigns/{campaign}/attach-designs'
 */
    const attachDesignsForm = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: attachDesigns.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CampaignController::attachDesigns
 * @see app/Http/Controllers/CampaignController.php:288
 * @route '/campaigns/{campaign}/attach-designs'
 */
        attachDesignsForm.post = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: attachDesigns.url(args, options),
            method: 'post',
        })
    
    attachDesigns.form = attachDesignsForm
/**
* @see \App\Http\Controllers\CampaignController::archive
 * @see app/Http/Controllers/CampaignController.php:464
 * @route '/campaigns/{campaign}/archive'
 */
export const archive = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: archive.url(args, options),
    method: 'post',
})

archive.definition = {
    methods: ["post"],
    url: '/campaigns/{campaign}/archive',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CampaignController::archive
 * @see app/Http/Controllers/CampaignController.php:464
 * @route '/campaigns/{campaign}/archive'
 */
archive.url = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { campaign: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: typeof args.campaign === 'object'
                ? args.campaign.id
                : args.campaign,
                }

    return archive.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::archive
 * @see app/Http/Controllers/CampaignController.php:464
 * @route '/campaigns/{campaign}/archive'
 */
archive.post = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: archive.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CampaignController::archive
 * @see app/Http/Controllers/CampaignController.php:464
 * @route '/campaigns/{campaign}/archive'
 */
    const archiveForm = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: archive.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CampaignController::archive
 * @see app/Http/Controllers/CampaignController.php:464
 * @route '/campaigns/{campaign}/archive'
 */
        archiveForm.post = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: archive.url(args, options),
            method: 'post',
        })
    
    archive.form = archiveForm
/**
* @see \App\Http\Controllers\CampaignController::unarchive
 * @see app/Http/Controllers/CampaignController.php:480
 * @route '/campaigns/{campaign}/unarchive'
 */
export const unarchive = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: unarchive.url(args, options),
    method: 'post',
})

unarchive.definition = {
    methods: ["post"],
    url: '/campaigns/{campaign}/unarchive',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CampaignController::unarchive
 * @see app/Http/Controllers/CampaignController.php:480
 * @route '/campaigns/{campaign}/unarchive'
 */
unarchive.url = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { campaign: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: typeof args.campaign === 'object'
                ? args.campaign.id
                : args.campaign,
                }

    return unarchive.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::unarchive
 * @see app/Http/Controllers/CampaignController.php:480
 * @route '/campaigns/{campaign}/unarchive'
 */
unarchive.post = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: unarchive.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CampaignController::unarchive
 * @see app/Http/Controllers/CampaignController.php:480
 * @route '/campaigns/{campaign}/unarchive'
 */
    const unarchiveForm = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: unarchive.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CampaignController::unarchive
 * @see app/Http/Controllers/CampaignController.php:480
 * @route '/campaigns/{campaign}/unarchive'
 */
        unarchiveForm.post = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: unarchive.url(args, options),
            method: 'post',
        })
    
    unarchive.form = unarchiveForm
/**
* @see \App\Http\Controllers\CampaignController::update
 * @see app/Http/Controllers/CampaignController.php:396
 * @route '/campaigns/{campaign}'
 */
export const update = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/campaigns/{campaign}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\CampaignController::update
 * @see app/Http/Controllers/CampaignController.php:396
 * @route '/campaigns/{campaign}'
 */
update.url = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { campaign: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: typeof args.campaign === 'object'
                ? args.campaign.id
                : args.campaign,
                }

    return update.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::update
 * @see app/Http/Controllers/CampaignController.php:396
 * @route '/campaigns/{campaign}'
 */
update.put = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\CampaignController::update
 * @see app/Http/Controllers/CampaignController.php:396
 * @route '/campaigns/{campaign}'
 */
    const updateForm = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CampaignController::update
 * @see app/Http/Controllers/CampaignController.php:396
 * @route '/campaigns/{campaign}'
 */
        updateForm.put = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\CampaignController::destroy
 * @see app/Http/Controllers/CampaignController.php:452
 * @route '/campaigns/{campaign}'
 */
export const destroy = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/campaigns/{campaign}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CampaignController::destroy
 * @see app/Http/Controllers/CampaignController.php:452
 * @route '/campaigns/{campaign}'
 */
destroy.url = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { campaign: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { campaign: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    campaign: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        campaign: typeof args.campaign === 'object'
                ? args.campaign.id
                : args.campaign,
                }

    return destroy.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CampaignController::destroy
 * @see app/Http/Controllers/CampaignController.php:452
 * @route '/campaigns/{campaign}'
 */
destroy.delete = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\CampaignController::destroy
 * @see app/Http/Controllers/CampaignController.php:452
 * @route '/campaigns/{campaign}'
 */
    const destroyForm = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CampaignController::destroy
 * @see app/Http/Controllers/CampaignController.php:452
 * @route '/campaigns/{campaign}'
 */
        destroyForm.delete = (args: { campaign: number | { id: number } } | [campaign: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const campaigns = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
generator: Object.assign(generator, generator),
attachDesigns: Object.assign(attachDesigns, attachDesigns),
archive: Object.assign(archive, archive),
unarchive: Object.assign(unarchive, unarchive),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default campaigns
import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
const index0ac3f17825ff0d98a55e27e88bab35b2 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0ac3f17825ff0d98a55e27e88bab35b2.url(options),
    method: 'get',
})

index0ac3f17825ff0d98a55e27e88bab35b2.definition = {
    methods: ["get","head"],
    url: '/generator',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
index0ac3f17825ff0d98a55e27e88bab35b2.url = (options?: RouteQueryOptions) => {
    return index0ac3f17825ff0d98a55e27e88bab35b2.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
index0ac3f17825ff0d98a55e27e88bab35b2.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index0ac3f17825ff0d98a55e27e88bab35b2.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
index0ac3f17825ff0d98a55e27e88bab35b2.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index0ac3f17825ff0d98a55e27e88bab35b2.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
    const index0ac3f17825ff0d98a55e27e88bab35b2Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index0ac3f17825ff0d98a55e27e88bab35b2.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
        index0ac3f17825ff0d98a55e27e88bab35b2Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0ac3f17825ff0d98a55e27e88bab35b2.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
        index0ac3f17825ff0d98a55e27e88bab35b2Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index0ac3f17825ff0d98a55e27e88bab35b2.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index0ac3f17825ff0d98a55e27e88bab35b2.form = index0ac3f17825ff0d98a55e27e88bab35b2Form
    /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
const index5fcfe65ad2da5e65a33ffea2aaa0469f = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index5fcfe65ad2da5e65a33ffea2aaa0469f.url(args, options),
    method: 'get',
})

index5fcfe65ad2da5e65a33ffea2aaa0469f.definition = {
    methods: ["get","head"],
    url: '/campaigns/{campaign}/generator',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
index5fcfe65ad2da5e65a33ffea2aaa0469f.url = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return index5fcfe65ad2da5e65a33ffea2aaa0469f.definition.url
            .replace('{campaign}', parsedArgs.campaign.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
index5fcfe65ad2da5e65a33ffea2aaa0469f.get = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index5fcfe65ad2da5e65a33ffea2aaa0469f.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
index5fcfe65ad2da5e65a33ffea2aaa0469f.head = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index5fcfe65ad2da5e65a33ffea2aaa0469f.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
    const index5fcfe65ad2da5e65a33ffea2aaa0469fForm = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index5fcfe65ad2da5e65a33ffea2aaa0469f.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
        index5fcfe65ad2da5e65a33ffea2aaa0469fForm.get = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index5fcfe65ad2da5e65a33ffea2aaa0469f.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/campaigns/{campaign}/generator'
 */
        index5fcfe65ad2da5e65a33ffea2aaa0469fForm.head = (args: { campaign: string | number } | [campaign: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index5fcfe65ad2da5e65a33ffea2aaa0469f.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index5fcfe65ad2da5e65a33ffea2aaa0469f.form = index5fcfe65ad2da5e65a33ffea2aaa0469fForm

/**
* Multiple routes resolve to \App\Http\Controllers\GeneratorController::index, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `index['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const index = {
    '/generator': index0ac3f17825ff0d98a55e27e88bab35b2,
    '/campaigns/{campaign}/generator': index5fcfe65ad2da5e65a33ffea2aaa0469f,
}

/**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:44
 * @route '/generator'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/generator',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:44
 * @route '/generator'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:44
 * @route '/generator'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:44
 * @route '/generator'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:44
 * @route '/generator'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\GeneratorController::generatePrompt
 * @see app/Http/Controllers/GeneratorController.php:375
 * @route '/generator/prompt'
 */
export const generatePrompt = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePrompt.url(options),
    method: 'post',
})

generatePrompt.definition = {
    methods: ["post"],
    url: '/generator/prompt',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GeneratorController::generatePrompt
 * @see app/Http/Controllers/GeneratorController.php:375
 * @route '/generator/prompt'
 */
generatePrompt.url = (options?: RouteQueryOptions) => {
    return generatePrompt.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::generatePrompt
 * @see app/Http/Controllers/GeneratorController.php:375
 * @route '/generator/prompt'
 */
generatePrompt.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePrompt.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GeneratorController::generatePrompt
 * @see app/Http/Controllers/GeneratorController.php:375
 * @route '/generator/prompt'
 */
    const generatePromptForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generatePrompt.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::generatePrompt
 * @see app/Http/Controllers/GeneratorController.php:375
 * @route '/generator/prompt'
 */
        generatePromptForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generatePrompt.url(options),
            method: 'post',
        })
    
    generatePrompt.form = generatePromptForm
const GeneratorController = { index, store, generatePrompt }

export default GeneratorController
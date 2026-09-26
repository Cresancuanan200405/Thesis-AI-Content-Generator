import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import manual8a44cf from './manual'
/**
* @see \App\Http\Controllers\AutomaticGeneratorController::automatic
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
export const automatic = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: automatic.url(options),
    method: 'post',
})

automatic.definition = {
    methods: ["post"],
    url: '/generator/automatic',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AutomaticGeneratorController::automatic
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
automatic.url = (options?: RouteQueryOptions) => {
    return automatic.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AutomaticGeneratorController::automatic
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
automatic.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: automatic.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AutomaticGeneratorController::automatic
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
    const automaticForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: automatic.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AutomaticGeneratorController::automatic
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
        automaticForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: automatic.url(options),
            method: 'post',
        })
    
    automatic.form = automaticForm
/**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/manual'
 */
export const manual = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: manual.url(options),
    method: 'post',
})

manual.definition = {
    methods: ["post"],
    url: '/generator/manual',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/manual'
 */
manual.url = (options?: RouteQueryOptions) => {
    return manual.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/manual'
 */
manual.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: manual.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/manual'
 */
    const manualForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: manual.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/manual'
 */
        manualForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: manual.url(options),
            method: 'post',
        })
    
    manual.form = manualForm
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/generator',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:30
 * @route '/generator'
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
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:50
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
 * @see app/Http/Controllers/GeneratorController.php:50
 * @route '/generator'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:50
 * @route '/generator'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:50
 * @route '/generator'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:50
 * @route '/generator'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ManualGeneratorController::preview
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/preview'
 */
export const preview = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preview.url(options),
    method: 'post',
})

preview.definition = {
    methods: ["post"],
    url: '/generator/preview',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::preview
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/preview'
 */
preview.url = (options?: RouteQueryOptions) => {
    return preview.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::preview
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/preview'
 */
preview.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: preview.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::preview
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/preview'
 */
    const previewForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: preview.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::preview
 * @see app/Http/Controllers/ManualGeneratorController.php:51
 * @route '/generator/preview'
 */
        previewForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: preview.url(options),
            method: 'post',
        })
    
    preview.form = previewForm
/**
* @see \App\Http\Controllers\GeneratorController::prompt
 * @see app/Http/Controllers/GeneratorController.php:381
 * @route '/generator/prompt'
 */
export const prompt = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prompt.url(options),
    method: 'post',
})

prompt.definition = {
    methods: ["post"],
    url: '/generator/prompt',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GeneratorController::prompt
 * @see app/Http/Controllers/GeneratorController.php:381
 * @route '/generator/prompt'
 */
prompt.url = (options?: RouteQueryOptions) => {
    return prompt.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::prompt
 * @see app/Http/Controllers/GeneratorController.php:381
 * @route '/generator/prompt'
 */
prompt.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: prompt.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GeneratorController::prompt
 * @see app/Http/Controllers/GeneratorController.php:381
 * @route '/generator/prompt'
 */
    const promptForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: prompt.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::prompt
 * @see app/Http/Controllers/GeneratorController.php:381
 * @route '/generator/prompt'
 */
        promptForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: prompt.url(options),
            method: 'post',
        })
    
    prompt.form = promptForm
const generator = {
    automatic: Object.assign(automatic, automatic),
manual: Object.assign(manual, manual8a44cf),
index: Object.assign(index, index),
store: Object.assign(store, store),
preview: Object.assign(preview, preview),
prompt: Object.assign(prompt, prompt),
}

export default generator
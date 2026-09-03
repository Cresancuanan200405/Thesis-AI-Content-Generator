import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
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
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
 * @route '/generator'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\GeneratorController::index
 * @see app/Http/Controllers/GeneratorController.php:29
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
 * @see app/Http/Controllers/GeneratorController.php:120
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
 * @see app/Http/Controllers/GeneratorController.php:120
 * @route '/generator'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:120
 * @route '/generator'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:120
 * @route '/generator'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::store
 * @see app/Http/Controllers/GeneratorController.php:120
 * @route '/generator'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\GeneratorController::generatePreview
 * @see app/Http/Controllers/GeneratorController.php:300
 * @route '/generator/preview'
 */
export const generatePreview = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreview.url(options),
    method: 'post',
})

generatePreview.definition = {
    methods: ["post"],
    url: '/generator/preview',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GeneratorController::generatePreview
 * @see app/Http/Controllers/GeneratorController.php:300
 * @route '/generator/preview'
 */
generatePreview.url = (options?: RouteQueryOptions) => {
    return generatePreview.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeneratorController::generatePreview
 * @see app/Http/Controllers/GeneratorController.php:300
 * @route '/generator/preview'
 */
generatePreview.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreview.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\GeneratorController::generatePreview
 * @see app/Http/Controllers/GeneratorController.php:300
 * @route '/generator/preview'
 */
    const generatePreviewForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generatePreview.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\GeneratorController::generatePreview
 * @see app/Http/Controllers/GeneratorController.php:300
 * @route '/generator/preview'
 */
        generatePreviewForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generatePreview.url(options),
            method: 'post',
        })
    
    generatePreview.form = generatePreviewForm
const GeneratorController = { index, store, generatePreview }

export default GeneratorController
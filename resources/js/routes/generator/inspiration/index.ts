import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/generator/inspiration',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VisualInspirationController::index
 * @see app/Http/Controllers/VisualInspirationController.php:17
 * @route '/generator/inspiration'
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
* @see \App\Http\Controllers\VisualInspirationController::analyze
 * @see app/Http/Controllers/VisualInspirationController.php:28
 * @route '/generator/inspiration/analyze'
 */
export const analyze = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: analyze.url(options),
    method: 'post',
})

analyze.definition = {
    methods: ["post"],
    url: '/generator/inspiration/analyze',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VisualInspirationController::analyze
 * @see app/Http/Controllers/VisualInspirationController.php:28
 * @route '/generator/inspiration/analyze'
 */
analyze.url = (options?: RouteQueryOptions) => {
    return analyze.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisualInspirationController::analyze
 * @see app/Http/Controllers/VisualInspirationController.php:28
 * @route '/generator/inspiration/analyze'
 */
analyze.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: analyze.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VisualInspirationController::analyze
 * @see app/Http/Controllers/VisualInspirationController.php:28
 * @route '/generator/inspiration/analyze'
 */
    const analyzeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: analyze.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VisualInspirationController::analyze
 * @see app/Http/Controllers/VisualInspirationController.php:28
 * @route '/generator/inspiration/analyze'
 */
        analyzeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: analyze.url(options),
            method: 'post',
        })
    
    analyze.form = analyzeForm
const inspiration = {
    index: Object.assign(index, index),
analyze: Object.assign(analyze, analyze),
}

export default inspiration
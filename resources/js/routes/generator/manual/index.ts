import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/generator/manual',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:36
 * @route '/generator/manual'
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
* @see \App\Http\Controllers\ManualGeneratorController::suggestTagline
 * @see app/Http/Controllers/ManualGeneratorController.php:440
 * @route '/generator/manual/suggest-tagline'
 */
export const suggestTagline = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suggestTagline.url(options),
    method: 'post',
})

suggestTagline.definition = {
    methods: ["post"],
    url: '/generator/manual/suggest-tagline',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::suggestTagline
 * @see app/Http/Controllers/ManualGeneratorController.php:440
 * @route '/generator/manual/suggest-tagline'
 */
suggestTagline.url = (options?: RouteQueryOptions) => {
    return suggestTagline.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::suggestTagline
 * @see app/Http/Controllers/ManualGeneratorController.php:440
 * @route '/generator/manual/suggest-tagline'
 */
suggestTagline.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suggestTagline.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::suggestTagline
 * @see app/Http/Controllers/ManualGeneratorController.php:440
 * @route '/generator/manual/suggest-tagline'
 */
    const suggestTaglineForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: suggestTagline.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::suggestTagline
 * @see app/Http/Controllers/ManualGeneratorController.php:440
 * @route '/generator/manual/suggest-tagline'
 */
        suggestTaglineForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: suggestTagline.url(options),
            method: 'post',
        })
    
    suggestTagline.form = suggestTaglineForm
const manual = {
    suggestTagline: Object.assign(suggestTagline, suggestTagline),
}

export default manual
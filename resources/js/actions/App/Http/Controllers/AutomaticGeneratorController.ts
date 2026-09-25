import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/generator/automatic',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AutomaticGeneratorController::index
 * @see app/Http/Controllers/AutomaticGeneratorController.php:32
 * @route '/generator/automatic'
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
* @see \App\Http\Controllers\AutomaticGeneratorController::generate
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
export const generate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate.url(options),
    method: 'post',
})

generate.definition = {
    methods: ["post"],
    url: '/generator/automatic',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AutomaticGeneratorController::generate
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
generate.url = (options?: RouteQueryOptions) => {
    return generate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AutomaticGeneratorController::generate
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
generate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AutomaticGeneratorController::generate
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
    const generateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generate.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AutomaticGeneratorController::generate
 * @see app/Http/Controllers/AutomaticGeneratorController.php:47
 * @route '/generator/automatic'
 */
        generateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generate.url(options),
            method: 'post',
        })
    
    generate.form = generateForm
const AutomaticGeneratorController = { index, generate }

export default AutomaticGeneratorController
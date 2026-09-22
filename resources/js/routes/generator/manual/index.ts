import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:31
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
 * @see app/Http/Controllers/ManualGeneratorController.php:31
 * @route '/generator/manual'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:31
 * @route '/generator/manual'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:31
 * @route '/generator/manual'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:31
 * @route '/generator/manual'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:31
 * @route '/generator/manual'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ManualGeneratorController::index
 * @see app/Http/Controllers/ManualGeneratorController.php:31
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
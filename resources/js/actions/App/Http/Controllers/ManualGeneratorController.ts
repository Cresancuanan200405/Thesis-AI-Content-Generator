import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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
/**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/manual'
 */
const generate2e97c079c13eb4ef5da2461c196bb523 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate2e97c079c13eb4ef5da2461c196bb523.url(options),
    method: 'post',
})

generate2e97c079c13eb4ef5da2461c196bb523.definition = {
    methods: ["post"],
    url: '/generator/manual',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/manual'
 */
generate2e97c079c13eb4ef5da2461c196bb523.url = (options?: RouteQueryOptions) => {
    return generate2e97c079c13eb4ef5da2461c196bb523.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/manual'
 */
generate2e97c079c13eb4ef5da2461c196bb523.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate2e97c079c13eb4ef5da2461c196bb523.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/manual'
 */
    const generate2e97c079c13eb4ef5da2461c196bb523Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generate2e97c079c13eb4ef5da2461c196bb523.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/manual'
 */
        generate2e97c079c13eb4ef5da2461c196bb523Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generate2e97c079c13eb4ef5da2461c196bb523.url(options),
            method: 'post',
        })
    
    generate2e97c079c13eb4ef5da2461c196bb523.form = generate2e97c079c13eb4ef5da2461c196bb523Form
    /**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/preview'
 */
const generate679b11045a9e0949a399bcb3b85572cc = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate679b11045a9e0949a399bcb3b85572cc.url(options),
    method: 'post',
})

generate679b11045a9e0949a399bcb3b85572cc.definition = {
    methods: ["post"],
    url: '/generator/preview',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/preview'
 */
generate679b11045a9e0949a399bcb3b85572cc.url = (options?: RouteQueryOptions) => {
    return generate679b11045a9e0949a399bcb3b85572cc.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/preview'
 */
generate679b11045a9e0949a399bcb3b85572cc.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate679b11045a9e0949a399bcb3b85572cc.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/preview'
 */
    const generate679b11045a9e0949a399bcb3b85572ccForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generate679b11045a9e0949a399bcb3b85572cc.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::generate
 * @see app/Http/Controllers/ManualGeneratorController.php:45
 * @route '/generator/preview'
 */
        generate679b11045a9e0949a399bcb3b85572ccForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generate679b11045a9e0949a399bcb3b85572cc.url(options),
            method: 'post',
        })
    
    generate679b11045a9e0949a399bcb3b85572cc.form = generate679b11045a9e0949a399bcb3b85572ccForm

/**
* Multiple routes resolve to \App\Http\Controllers\ManualGeneratorController::generate, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `generate['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const generate = {
    '/generator/manual': generate2e97c079c13eb4ef5da2461c196bb523,
    '/generator/preview': generate679b11045a9e0949a399bcb3b85572cc,
}

const ManualGeneratorController = { index, generate }

export default ManualGeneratorController
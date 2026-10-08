import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:52
 * @route '/generator/manual/generate'
 */
export const manual = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: manual.url(options),
    method: 'post',
})

manual.definition = {
    methods: ["post"],
    url: '/generator/manual/generate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:52
 * @route '/generator/manual/generate'
 */
manual.url = (options?: RouteQueryOptions) => {
    return manual.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:52
 * @route '/generator/manual/generate'
 */
manual.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: manual.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:52
 * @route '/generator/manual/generate'
 */
    const manualForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: manual.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManualGeneratorController::manual
 * @see app/Http/Controllers/ManualGeneratorController.php:52
 * @route '/generator/manual/generate'
 */
        manualForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: manual.url(options),
            method: 'post',
        })
    
    manual.form = manualForm
const generate = {
    manual: Object.assign(manual, manual),
}

export default generate
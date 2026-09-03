import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/calendar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EventController::index
 * @see app/Http/Controllers/EventController.php:21
 * @route '/calendar'
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
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
export const yearEvents = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: yearEvents.url(options),
    method: 'get',
})

yearEvents.definition = {
    methods: ["get","head"],
    url: '/calendar/events-year',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
yearEvents.url = (options?: RouteQueryOptions) => {
    return yearEvents.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
yearEvents.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: yearEvents.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
yearEvents.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: yearEvents.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
    const yearEventsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: yearEvents.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
        yearEventsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: yearEvents.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EventController::yearEvents
 * @see app/Http/Controllers/EventController.php:142
 * @route '/calendar/events-year'
 */
        yearEventsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: yearEvents.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    yearEvents.form = yearEventsForm
const calendar = {
    index: Object.assign(index, index),
yearEvents: Object.assign(yearEvents, yearEvents),
}

export default calendar
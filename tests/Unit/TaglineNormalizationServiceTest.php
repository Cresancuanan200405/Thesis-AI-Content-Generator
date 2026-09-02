<?php

use App\Services\TaglineNormalizationService;

it('1. normalizes null to null', function () {
    expect(TaglineNormalizationService::normalize(null))->toBeNull();
});

it('2. normalizes empty string to null', function () {
    expect(TaglineNormalizationService::normalize(''))->toBeNull();
});

it('3. normalizes whitespace-only to null', function () {
    expect(TaglineNormalizationService::normalize('   '))->toBeNull();
});

it('4. removes trailing period', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste.'))->toBe('Fresh Taste');
});

it('5. removes multiple periods', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste..'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('Fresh Taste....'))->toBe('Fresh Taste');
});

it('6. removes trailing ellipsis', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste...'))->toBe('Fresh Taste');
});

it('7. removes Unicode ellipsis', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste…'))->toBe('Fresh Taste');
});

it('8. removes trailing ampersand', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste &'))->toBe('Fresh Taste');
});

it('9. removes trailing hyphen', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste -'))->toBe('Fresh Taste');
});

it('10. removes trailing en-dash', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste –'))->toBe('Fresh Taste');
});

it('11. removes trailing em-dash', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste —'))->toBe('Fresh Taste');
});

it('12. removes trailing slash', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste /'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('Fresh Taste \\'))->toBe('Fresh Taste');
});

it('13. removes trailing pipe', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste |'))->toBe('Fresh Taste');
});

it('14. removes trailing colon', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste:'))->toBe('Fresh Taste');
});

it('15. removes trailing semicolon', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste;'))->toBe('Fresh Taste');
});

it('16. removes surrounding double quotes', function () {
    expect(TaglineNormalizationService::normalize('"Fresh Taste"'))->toBe('Fresh Taste');
});

it('17. removes surrounding smart quotes', function () {
    expect(TaglineNormalizationService::normalize('“Fresh Taste”'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('‘Fresh Taste’'))->toBe('Fresh Taste');
});

it('18. removes surrounding single quotes', function () {
    expect(TaglineNormalizationService::normalize("'Fresh Taste'"))->toBe('Fresh Taste');
});

it('19. preserves intentional exclamation mark', function () {
    expect(TaglineNormalizationService::normalize('Taste the magic!'))->toBe('Taste the magic!')
        ->and(TaglineNormalizationService::normalize('Drive cleaner. Shine brighter!'))->toBe('Drive cleaner. Shine brighter!');
});

it('20. preserves intentional question mark', function () {
    expect(TaglineNormalizationService::normalize('Craving more?'))->toBe('Craving more?')
        ->and(TaglineNormalizationService::normalize('Ready for summer?'))->toBe('Ready for summer?');
});

it('21. preserves internal ampersand', function () {
    expect(TaglineNormalizationService::normalize('Sweet, savory & fresh'))->toBe('Sweet, savory & fresh')
        ->and(TaglineNormalizationService::normalize('Fresh, bold & delicious'))->toBe('Fresh, bold & delicious');
});

it('22. preserves internal slash', function () {
    expect(TaglineNormalizationService::normalize('24/7 Service'))->toBe('24/7 Service');
});

it('23. preserves internal hyphen', function () {
    expect(TaglineNormalizationService::normalize('All-in-one solution'))->toBe('All-in-one solution')
        ->and(TaglineNormalizationService::normalize('Small-batch roasted'))->toBe('Small-batch roasted');
});

it('24. cleans mixed trailing garbage combinations', function () {
    expect(TaglineNormalizationService::normalize('Fresh Taste... &'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('Fresh Taste — -'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('Fresh Taste &...'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('Fresh Taste: -'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('“Fresh Taste...”'))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('  "Fresh Taste..."  '))->toBe('Fresh Taste')
        ->and(TaglineNormalizationService::normalize('“Sweet, savory & fresh... &”'))->toBe('Sweet, savory & fresh');
});

it('25. is purely idempotent', function () {
    $inputs = [
        'Fresh Taste.',
        '  “Fresh Taste...”  ',
        'Taste the magic!',
        'Craving more?',
        'Sweet, savory & fresh',
        'Fresh Taste & -',
        '24/7 Service /',
        'All-in-one solution',
    ];

    foreach ($inputs as $input) {
        $once = TaglineNormalizationService::normalize($input);
        $twice = TaglineNormalizationService::normalize($once);
        $thrice = TaglineNormalizationService::normalize($twice);
        expect($twice)->toBe($once)
            ->and($thrice)->toBe($once);
    }
});

it('26. handles exact production audit test matrix', function () {
    expect(TaglineNormalizationService::normalize('Hello World&'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World &'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World...'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('"Hello World"'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('“Hello World”'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World,'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World:'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World;'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World -'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World —'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World /'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World |'))->toBe('Hello World')
        ->and(TaglineNormalizationService::normalize('Hello World !'))->toBe('Hello World !')
        ->and(TaglineNormalizationService::normalize('Hello World ?'))->toBe('Hello World ?')
        ->and(TaglineNormalizationService::normalize('Hello & World'))->toBe('Hello & World')
        ->and(TaglineNormalizationService::normalize('Rock & Roll'))->toBe('Rock & Roll')
        ->and(TaglineNormalizationService::normalize('R&B Coffee'))->toBe('R&B Coffee')
        ->and(TaglineNormalizationService::normalize('A&B Café'))->toBe('A&B Café');
});

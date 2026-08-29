<?php

namespace App\Services;

class TaglineNormalizationService
{
    /**
     * Normalize a marketing tagline into a clean, canonical marketing phrase.
     */
    public static function normalize(?string $tagline): ?string
    {
        if ($tagline === null) {
            return null;
        }

        $clean = trim($tagline);
        if ($clean === '') {
            return null;
        }

        // Loop to handle combinations of surrounding quotes, trailing ellipsis, and dangling symbols
        $previous = '';
        while ($clean !== '' && $clean !== $previous) {
            $previous = $clean;

            // 1. Remove enclosing quotation marks around the entire tagline
            $clean = self::stripSurroundingQuotes($clean);

            // 2. Remove trailing ellipses (... or …) and repeated dots
            $clean = (string) preg_replace('/(?:\.{2,}|\x{2026})+$/u', '', $clean);

            // 3. Remove trailing dangling punctuation / connector symbols (. , : ; & - – — / \ | _ ~)
            // Note: Does NOT remove ! or ?
            $clean = (string) preg_replace('/[\s\.,:;&\-\x{2013}\x{2014}\/\\\\\|_~]+$/u', '', $clean);

            $clean = trim($clean);
        }

        return $clean !== '' ? $clean : null;
    }

    /**
     * Remove enclosing quotation marks if they wrap the entire string.
     */
    protected static function stripSurroundingQuotes(string $str): string
    {
        $quotes = [
            ['"', '"'],
            ["'", "'"],
            ['“', '”'],
            ['‘', '’'],
            ['“', '"'],
            ['"', '”'],
            ['‘', "'"],
            ["'", '’'],
        ];

        $trimmed = trim($str);
        foreach ($quotes as [$start, $end]) {
            if (str_starts_with($trimmed, $start) && str_ends_with($trimmed, $end) && mb_strlen($trimmed) >= (mb_strlen($start) + mb_strlen($end))) {
                $trimmed = mb_substr($trimmed, mb_strlen($start), mb_strlen($trimmed) - mb_strlen($start) - mb_strlen($end));
                $trimmed = trim($trimmed);
            }
        }

        return $trimmed;
    }
}

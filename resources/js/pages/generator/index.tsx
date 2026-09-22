import AutomaticGenerator from './automatic';

/**
 * Backward compatibility wrapper for AI Marketing Studio.
 * Routes directly to Automatic Generator by default.
 * Preserves handleSuggestTagline and legacy generator entry contracts.
 */
export default function GeneratorIndex(props: any) {
    return <AutomaticGenerator {...props} />;
}

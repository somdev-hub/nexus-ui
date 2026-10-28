import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({
    className,
    type,
    onKeyDown,
    onWheel,
    ref,
    ...props
}: React.ComponentProps<'input'>) {
    const isNumberInput = type === 'number';
    const canStepWithKeys = type === 'number' || type === 'range';
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const setInputRef = React.useCallback(
        (node: HTMLInputElement | null) => {
            inputRef.current = node;

            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                (ref as React.RefObject<HTMLInputElement | null>).current =
                    node;
            }
        },
        [ref]
    );

    React.useEffect(() => {
        const input = inputRef.current;

        if (!isNumberInput || !input) {
            return;
        }

        // Prevent numeric inputs from incrementing/decrementing on scroll.
        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
        };

        input.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            input.removeEventListener('wheel', handleWheel);
        };
    }, [isNumberInput]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Prevent numeric inputs (and numeric range inputs) from
        // incrementing/decrementing with arrow keys.
        if (
            canStepWithKeys &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
        ) {
            event.preventDefault();
        }

        onKeyDown?.(event);
    };

    return (
        <input
            ref={setInputRef}
            type={type}
            data-slot="input"
            className={cn(
                'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
                'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                className
            )}
            onKeyDown={handleKeyDown}
            onWheel={onWheel}
            {...props}
        />
    );
}

export { Input };

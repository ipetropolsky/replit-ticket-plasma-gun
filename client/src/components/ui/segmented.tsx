import { Button } from 'src/components/ui/button.tsx';

export interface SegmentedVariant<T> {
    label: string;
    value: T;
}

export type SegmentedVariants<T> = SegmentedVariant<T>[];

interface SegmentedProps<T> {
    variants: SegmentedVariants<T>;
    value: T;
    onChange: (value: T) => void;
}

export const Segmented = <T extends string,>({ variants, value, onChange }: SegmentedProps<T>) => {
    return (
        <div className="flex border p-1" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', }}>
            {variants.map((variant) => {
                return (
                    <Button
                        key={variant.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange(variant.value)}
                        className={`h-8 px-3 text-xs text-md ${
                            variant.value === value
                                ? 'bg-white shadow-sm'
                                : 'hover:bg-white/50'
                        }`}
                        style={{
                            ...(variant.value === value ? {
                                backgroundColor: '#ffffff',
                                color: '#0070ff',
                                borderRadius: '8px',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            } : {})
                        }}
                    >
                        {variant.label}
                    </Button>
                );
            })}
        </div>
    )
}

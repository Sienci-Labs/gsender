import { Checkbox } from 'app/components/shadcn/Checkbox';
import cx from 'classnames';
import { neutral, severity } from '../../messages/styles';
import type { HelperChecklistItem, HelperKind } from '../../messages/types';

interface Props {
    kind: HelperKind;
    items: HelperChecklistItem[];
    checked: Record<string, boolean>;
    onChange: (id: string, value: boolean) => void;
}

export function ChecklistBlock({ kind, items, checked, onChange }: Props) {
    const { tint, line } = severity({ kind });

    return (
        <div className="flex flex-col gap-3">
            {items.map((item) => {
                const isChecked = Boolean(checked[item.id]);
                return (
                    <label
                        key={item.id}
                        className={cx(
                            'flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3.5 text-[15px]',
                            neutral.title,
                            isChecked ? [tint(), line()] : neutral.panel,
                        )}
                    >
                        <Checkbox
                            className="h-5 w-5"
                            checked={isChecked}
                            onCheckedChange={(value) =>
                                onChange(item.id, value === true)
                            }
                        />
                        {item.label}
                    </label>
                );
            })}
        </div>
    );
}

import { useEffect, useState } from 'react';
import React from 'react';
import { toast } from 'app/lib/toaster';
import api from 'app/api';
import { Switch } from 'app/components/shadcn/Switch';
import MacroForm from 'app/features/Macros/MacroForm';

interface EventInputProps {
    eventType: string;
}

interface EventData {
    id: string;
    event: string;
    trigger: string;
    commands: string;
    enabled: boolean;
    mtime: number;
}

export function EventInput({ eventType }: EventInputProps): React.ReactElement {
    const [eventData, setEventData] = useState<EventData | null>(null);
    const [eventCommands, setCommands] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    async function toggleEvent() {
        if (!eventData) return;
        const event = { ...eventData };

        try {
            event.enabled = !event.enabled;

            setEventData(event);
            await api.events.update(event.event, {
                enabled: event.enabled,
            });
        } catch (e) {
            console.error(e);
        }
    }

    async function saveCommands(commands: string) {
        if (eventData?.id) {
            await api.events.update(eventType, { commands });
            setCommands(commands);
        } else {
            const res = await api.events.create({
                event: eventType,
                trigger: 'gcode',
                commands,
                enabled: true,
            });
            const { record } = res.data;
            setEventData(record);
            setCommands(record.commands);
        }
    }

    useEffect(() => {
        const fetchCall = async () => {
            const response = await api.events.fetch();
            const { records: jsonRecords } = response.data;
            const recordMap = new Map(Object.entries(jsonRecords));
            const event = recordMap.get(eventType) as EventData | undefined;

            if (event) {
                const { commands } = event;
                setEventData(event);
                commands && setCommands(commands);
            }
        };

        fetchCall().catch(() => {
            toast.error(`Unable to fetch event data ${eventType}`, {
                position: 'bottom-right',
            });
        });
    }, []);

    return (
        <div className="flex flex-col w-full gap-2">
            {isEditing && (
                <MacroForm
                    macroContent={eventCommands}
                    title="Edit Event"
                    dialogDescription="Enter the G-code commands to run for this event."
                    showNameField={false}
                    showDescriptionField={false}
                    allowEmptyContent
                    submitLabel="Save"
                    onSubmit={({ content }) => {
                        saveCommands(content).catch(() => {
                            toast.error('Unable to save event commands', {
                                position: 'bottom-right',
                            });
                        });
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            )}
            <div className="flex flex-row justify-between items-center">
                <span>Enabled:</span>
                <Switch
                    checked={eventData?.enabled ?? false}
                    onChange={toggleEvent}
                />
            </div>
            <textarea
                readOnly
                tabIndex={-1}
                rows={4}
                value={eventCommands || '; No commands set'}
                className="ring-1 ring-gray-300 rounded-md font-mono block w-full p-2 text-sm bg-gray-50 text-gray-500 resize-none pointer-events-none dark:bg-dark-lighter dark:text-gray-400 dark:ring-gray-600"
            />
            <button
                className="bg-white shadow p-2 text-sm rounded border border-blue-500 text-gray-700 hover:bg-gray-100 dark:bg-dark dark:text-white dark:hover:bg-dark-lighter"
                onClick={() => setIsEditing(true)}
            >
                Edit Event
            </button>
        </div>
    );
}

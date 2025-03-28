import { useEffect, useState } from 'react';
import { toast } from 'app/lib/toaster';
import api from 'app/api';
import ToggleSwitch from 'app/components/Switch';

interface EventInputProps {
    eventType: string;
}

export function EventInput({ eventType }: EventInputProps): JSX.Element {
    const [eventData, setEventData] = useState({});
    const [eventCommands, setCommands] = useState('');

    function onChange(e) {
        setCommands(e.target.value);
    }

    async function toggleEvent(e) {
        const event = { ...eventData };

        try {
            event.enabled = !event.enabled;

            setEventData(event);
            await api.events.update(event.event, {
                enabled: event.enabled,
            });
        } catch (e) {
            console.assert(e);
        }
    }

    async function onSave(e) {
        e.preventDefault();
        if (eventData.hasOwnProperty('id')) {
            await api.events.update(eventType, {
                commands: eventCommands,
            });
        } else {
            const res = await api.events.create({
                event: eventType,
                trigger: 'gcode',
                commands: eventCommands,
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
            const event = recordMap.get(eventType);
            if (event) {
                const { commands } = event;
                setEventData(event);
                //setEventData(recordMap.get(eventType));
                commands && setCommands(commands);
            }
        };

        fetchCall().catch((e) => {
            toast.error(`Unable to fetch event data ${eventType}`);
        });
    }, []);

    return (
        <div className="flex flex-col w-full gap-2">
            <div className="flex flex-row justify-between items-center">
                <span>Enabled:</span>
                <ToggleSwitch
                    checked={eventData.enabled}
                    onChange={toggleEvent}
                />
            </div>
            <textarea
                rows={8}
                value={eventCommands}
                onChange={onChange}
                className="rounded font-mono block w-full px-0 text-sm text-gray-800 bg-white border border-gray-200 resize-none focus:outline-none"
            />
            <button
                className="border bg-white border-blue-500 text-blue-500 hover:bg-gray-100 rounded p-2 shadow"
                onClick={onSave}
            >
                Save Event
            </button>
        </div>
    );
}

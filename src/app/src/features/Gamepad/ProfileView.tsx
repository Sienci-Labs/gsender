import { useTypedSelector } from 'app/hooks/useTypedSelector';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';
import { Input } from 'app/components/shadcn/Input';

type ProfileViewProps = {
    gamepadProfileId: string;
};

const ProfileView = ({ gamepadProfileId }: ProfileViewProps) => {
    const profile = useTypedSelector((state) =>
        state.gamepad.profiles.find((p) => p.id === gamepadProfileId),
    );

    if (!profile) {
        return <div>Profile not found</div>;
    }

    const buttonMappingsExample = [
        {
            button: '0',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
        {
            button: '1',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
        {
            button: '2',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
        {
            button: '3',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
        {
            button: '4',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
        {
            button: '5',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
        {
            button: '6',
            primary: 'Primary Action',
            secondary: 'Secondary Action',
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <section className="flex flex-col gap-3">
                    <section className="flex flex-col gap-1">
                        <h3 className="text-xl font-semibold">
                            Button Mappings
                        </h3>

                        <p className="text-sm text-gray-500">
                            Assign a &quot;Lockout&quot; button for gamepad
                            safety, or a &quot;Secondary Action&quot; button to
                            use like a function key and add additional
                            functionality to your gamepad.
                        </p>
                    </section>

                    <section className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Button</TableHead>
                                    <TableHead>Primary Action</TableHead>
                                    <TableHead>Secondary Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {buttonMappingsExample.map((mapping) => (
                                    <TableRow key={mapping.button}>
                                        <TableCell>{mapping.button}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>
                </section>

                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold">Axis Settings</h3>

                    <section className="border rounded-lg mb-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">
                                        Stick Direction
                                    </TableHead>
                                    <TableHead>Primary Axis</TableHead>
                                    <TableHead>Secondary Axis</TableHead>
                                    <TableHead>Invert Direction</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Stick 1 Left/Right</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Stick 1 Up/Down</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Stick 1 Use MPG</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Stick 2 Left/Right</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Stick 2 Up/Down</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Stick 2 Use MPG</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </section>

                    <div className="grid grid-cols-[200px_1fr] items-center gap-2">
                        <div className="font-medium">Deadzone</div>
                        <Input type="number" className="w-full" />

                        <div className="font-medium">
                            Movement Distance Increments
                        </div>
                        <Input type="number" className="w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;

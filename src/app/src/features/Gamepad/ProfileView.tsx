import { useTypedSelector } from 'app/hooks/useTypedSelector';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';
import { Input } from 'app/components/Input';
import Switch from 'app/components/Switch';
import {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from 'app/components/shadcn/Select';

import useGamepad from './useGamepad';
import React from 'react';

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

    const [stick1Horizontal, stick1Vertical, stick2Horizontal, stick2Vertical] =
        profile.axes;

    const axes = [
        [stick1Horizontal, stick1Vertical],
        [stick2Horizontal, stick2Vertical],
    ];

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="grid grid-cols-2 gap-4 h-full">
                <section className="flex flex-col gap-2">
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

                    <div className="border rounded-lg relative h-full max-h-[1000px]">
                        <div className="absolute overflow-y-auto h-full w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Button</TableHead>
                                        <TableHead>Primary Action</TableHead>
                                        <TableHead>Secondary Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profile.buttons.map((button) => (
                                        <TableRow key={button.index}>
                                            <TableCell>
                                                {button.label}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </section>

                <div className="flex flex-col gap-2">
                    <section className="flex flex-col gap-1">
                        <h3 className="text-xl font-semibold">Axis Settings</h3>

                        <p className="text-sm text-gray-500">
                            Configure joystick axis selection, sensitivity,
                            inversion, and deadzone settings to optimize your
                            gamepad's axis controls for precise machine
                            movement.
                        </p>
                    </section>

                    <div className="border rounded-lg relative h-full max-h-[500px]">
                        <div className="absolute overflow-y-auto h-full w-full">
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
                                    {axes.map((axis, index) => (
                                        <React.Fragment
                                            key={`${axis}-${new Date().getTime()}`}
                                        >
                                            <TableRow>
                                                <TableCell>
                                                    Stick {index + 1} Left/Right
                                                </TableCell>
                                                <TableCell>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select axis" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            <SelectGroup>
                                                                <SelectItem value="left">
                                                                    X
                                                                </SelectItem>
                                                                <SelectItem value="right">
                                                                    Y
                                                                </SelectItem>
                                                                <SelectItem value="up">
                                                                    Z
                                                                </SelectItem>
                                                                <SelectItem value="down">
                                                                    A
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select axis" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            <SelectGroup>
                                                                <SelectItem value="left">
                                                                    X
                                                                </SelectItem>
                                                                <SelectItem value="right">
                                                                    Y
                                                                </SelectItem>
                                                                <SelectItem value="up">
                                                                    Z
                                                                </SelectItem>
                                                                <SelectItem value="down">
                                                                    A
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Switch />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>
                                                    Stick {index + 1} Up/Down
                                                </TableCell>
                                                <TableCell>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select axis" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            <SelectGroup>
                                                                <SelectItem value="left">
                                                                    X
                                                                </SelectItem>
                                                                <SelectItem value="right">
                                                                    Y
                                                                </SelectItem>
                                                                <SelectItem value="up">
                                                                    Z
                                                                </SelectItem>
                                                                <SelectItem value="down">
                                                                    A
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select axis" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white">
                                                            <SelectGroup>
                                                                <SelectItem value="left">
                                                                    X
                                                                </SelectItem>
                                                                <SelectItem value="right">
                                                                    Y
                                                                </SelectItem>
                                                                <SelectItem value="up">
                                                                    Z
                                                                </SelectItem>
                                                                <SelectItem value="down">
                                                                    A
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Switch />
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 items-center gap-2">
                        <div className="flex flex-col gap-1">
                            <div className="text-sm">Deadzone</div>
                            <Input
                                type="number"
                                className="w-full"
                                suffix="%"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="text-sm">
                                Movement Distance Increments
                            </div>
                            <Input
                                type="number"
                                className="w-full"
                                suffix="mm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;

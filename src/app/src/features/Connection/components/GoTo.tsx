import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover.tsx';
import { FaPaperPlane } from 'react-icons/fa6';
import { Button } from 'app/components/Button';

export function GoTo() {
    return (
        <Popover>
            <PopoverTrigger className="border rounded hover:opacity-90 py-1 px-3 shadow border-blue-500 text-white bg-blue-500">
                <FaPaperPlane />
            </PopoverTrigger>
            <PopoverContent sideOffset={30} className="bg-white">
                <div className="">
                    <h1>Go To Location</h1>

                    <Button color="primary">Go!</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

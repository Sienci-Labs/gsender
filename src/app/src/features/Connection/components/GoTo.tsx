import {Popover, PopoverContent, PopoverTrigger} from "app/components/shadcn/Popover.tsx";
import {IconButton} from "app/components/IconButton";
import { FaPaperPlane } from "react-icons/fa6";
import {Button} from "app/components/Button";

export function GoTo() {
    return (
        <Popover>
            <PopoverTrigger>
                <IconButton icon={<FaPaperPlane />}></IconButton>
            </PopoverTrigger>
            <PopoverContent sideOffset={30} className="bg-white">
                <div className="">
                    <h1>Go To Location</h1>

                    <Button color="primary">Go!</Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

import { Tabs, TabsList, TabsTrigger } from "app/components/shadcn/Tabs";

import { ALL_CATEGORIES } from "app/constants";
import type { CommandKeys } from "app/lib/definitions/shortcuts";
import { cn } from "app/lib/utils";

interface Props {
	onChange: (category: string, shortcuts?: CommandKeys) => void;
	filterCategory: string;
}

const CategoryFilter = ({ onChange, filterCategory }: Props) => {
	return (
		<div className="flex items-center space-x-2 self-center">
			<Tabs value={filterCategory} onValueChange={onChange} className="w-full">
				<TabsList className="flex flex-wrap gap-1 h-auto bg-transparent">
					{ALL_CATEGORIES.map((category) => (
						<TabsTrigger
							key={category}
							value={category}
							className={cn("px-3 py-1 rounded-md capitalize")}
						>
							{category}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
};

export default CategoryFilter;

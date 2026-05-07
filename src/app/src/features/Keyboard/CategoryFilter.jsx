import { Tabs, TabsList, TabsTrigger } from "app/components/shadcn/Tabs";

import {
	ALL_CATEGORIES,
	ALL_CATEGORY,
	CARVING_CATEGORY,
	COOLANT_CATEGORY,
	GENERAL_CATEGORY,
	JOGGING_CATEGORY,
	LOCATION_CATEGORY,
	MACRO_CATEGORY,
	OVERRIDES_CATEGORY,
	PROBING_CATEGORY,
	SPINDLE_LASER_CATEGORY,
	TOOLBAR_CATEGORY,
	VISUALIZER_CATEGORY,
} from "app/constants";
import { cn } from "app/lib/utils";
import React, { useMemo } from "react";

const CategoryFilter = ({ onChange, filterCategory }) => {
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

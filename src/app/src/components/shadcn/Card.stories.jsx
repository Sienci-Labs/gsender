import { expect } from 'storybook/test';

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from './Card';

const meta = {
    component: Card,
    tags: ['ai-generated'],
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <CardTitle>Job Stats</CardTitle>
                <CardDescription>
                    Totals across all completed jobs
                </CardDescription>
            </CardHeader>
            <CardContent>142 jobs run</CardContent>
            <CardFooter>Last run 2 hours ago</CardFooter>
        </Card>
    ),
};

export default meta;

export const Default = {};

export const CssCheck = {
    play: async ({ canvas }) => {
        const title = canvas.getByRole('heading', { name: /job stats/i });
        // CardTitle uses text-blue-600 (#3978B3 in src/app/tailwind.config.ts) — fails if Tailwind did not load.
        await expect(getComputedStyle(title).color).toBe('rgb(57, 120, 179)');
    },
};

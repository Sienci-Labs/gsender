import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Tabs } from "../index";

// Regression test for the resize-listener leak: window.addEventListener was
// being called with no cleanup inside a useEffect keyed on `items`, which
// used to be a fresh array on every render of an always-mounted parent
// (see features/Tools/index.tsx), so the listener count grew unbounded.

const TabA = () => <div>Content A</div>;
const TabB = () => <div>Content B</div>;

const items = [
	{ label: "A", content: TabA },
	{ label: "B", content: TabB },
];

describe("Tabs", () => {
	it("subscribes to window resize exactly once, even across re-renders", () => {
		const addSpy = jest.spyOn(window, "addEventListener");
		const removeSpy = jest.spyOn(window, "removeEventListener");

		const { rerender } = render(
			<MemoryRouter>
				<Tabs items={items} />
			</MemoryRouter>,
		);

		for (let i = 0; i < 5; i++) {
			rerender(
				<MemoryRouter>
					<Tabs items={[...items]} />
				</MemoryRouter>,
			);
		}

		const resizeAdds = addSpy.mock.calls.filter(
			([event]) => event === "resize",
		);
		expect(resizeAdds.length).toBe(1);

		addSpy.mockRestore();
		removeSpy.mockRestore();
	});

	it("removes the resize listener on unmount", () => {
		const removeSpy = jest.spyOn(window, "removeEventListener");

		const { unmount } = render(
			<MemoryRouter>
				<Tabs items={items} />
			</MemoryRouter>,
		);
		unmount();

		const resizeRemoves = removeSpy.mock.calls.filter(
			([event]) => event === "resize",
		);
		expect(resizeRemoves.length).toBe(1);

		removeSpy.mockRestore();
	});
});

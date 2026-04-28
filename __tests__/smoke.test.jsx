import { render, screen } from "@testing-library/react";
import React from "react";

function Hello() {
	return <div>Hello World</div>;
}

test("renders hello world", () => {
	render(<Hello />);
	expect(screen.getByText("Hello World")).toBeInTheDocument();
});

const toStringArray = (value) =>
	Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

// param is manifest capabilties.
// unknown input degrades to empty arrays, denying any permissions
export const normalizeCapabilities = (raw) => {
	const source =
		raw && !Array.isArray(raw) && typeof raw === "object" ? raw : {};
	return {
		requestTypes: toStringArray(source.requestTypes),
		topics: toStringArray(source.topics),
		allowedFunctions: toStringArray(source.allowedFunctions),
	};
};

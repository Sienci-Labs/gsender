// G-code files are usually ASCII, but comments may carry UTF-8 text (e.g. a
// "°" in a tool name). Decode as UTF-8 when the bytes are valid UTF-8, and
// fall back to latin1 for legacy single-byte (Windows-1252) files.
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

const decodeGcode = (buffer) => {
	try {
		return utf8Decoder.decode(buffer);
	} catch {
		return Buffer.from(buffer).toString("latin1");
	}
};

export default decodeGcode;

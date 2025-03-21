import { useTypedSelector } from 'app/hooks/useTypedSelector';

const Size = () => {
    const bbox = useTypedSelector((state) => state.file.bbox);

    const formattedBBox = {
        delta: {
            x: bbox.delta.x.toFixed(2),
            y: bbox.delta.y.toFixed(2),
            z: bbox.delta.z.toFixed(2),
        },
        min: {
            x: bbox.min.x.toFixed(2),
            y: bbox.min.y.toFixed(2),
            z: bbox.min.z.toFixed(2),
        },
        max: {
            x: bbox.max.x.toFixed(2),
            y: bbox.max.y.toFixed(2),
            z: bbox.max.z.toFixed(2),
        },
    };
    return (
        <table className="border-collapse border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-300">
            <thead>
                <tr>
                    <th className="border border-gray-300 px-1 py-0.5"></th>
                    <th className="border border-gray-300 px-1 py-0.5">Size</th>
                    <th className="border border-gray-300 px-1 py-0.5">Min</th>
                    <th className="border border-gray-300 px-1 py-0.5">Max</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="border border-gray-300 px-1 py-0.5 font-bold">
                        X
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.delta.x}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.min.x}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.max.x}
                    </td>
                </tr>
                <tr>
                    <td className="border border-gray-300 px-1 py-0.5 font-bold">
                        Y
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.delta.y}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.min.y}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.max.y}
                    </td>
                </tr>
                <tr>
                    <td className="border border-gray-300 px-1 py-0.5 font-bold">
                        Z
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.delta.z}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.min.z}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5">
                        {formattedBBox.max.z}
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

export default Size;

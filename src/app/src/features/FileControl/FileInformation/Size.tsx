import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

const Size = () => {
    const bbox = useTypedSelector((state) => state.file.bbox);
    const usedAxes = useTypedSelector((state) => state.file.usedAxes);
    const { units } = useWorkspaceState();

    // Convert to inches if needed
    const conversionFactor = units === 'in' ? 1 / 25.4 : 1;

    const fileContainsA = usedAxes.includes('A');

    // if it is a whole number when rounded, don't show decimals
    const formattedBBox = {
        delta: {
            x:
                Number((bbox.delta.x * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.delta.x * conversionFactor
                    : (bbox.delta.x * conversionFactor).toFixed(2),
            y:
                Number((bbox.delta.y * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.delta.y * conversionFactor
                    : (bbox.delta.y * conversionFactor).toFixed(2),
            z:
                Number((bbox.delta.z * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.delta.z * conversionFactor
                    : (bbox.delta.z * conversionFactor).toFixed(2),
            a: Number(bbox.delta.a.toFixed(2)),
        },
        min: {
            x:
                Number((bbox.min.x * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.min.x * conversionFactor
                    : (bbox.min.x * conversionFactor).toFixed(2),
            y:
                Number((bbox.min.y * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.min.y * conversionFactor
                    : (bbox.min.y * conversionFactor).toFixed(2),
            z:
                Number((bbox.min.z * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.min.z * conversionFactor
                    : (bbox.min.z * conversionFactor).toFixed(2),
            a: Number(bbox.min.a.toFixed(2)),
        },
        max: {
            x:
                Number((bbox.max.x * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.max.x * conversionFactor
                    : (bbox.max.x * conversionFactor).toFixed(2),
            y:
                Number((bbox.max.y * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.max.y * conversionFactor
                    : (bbox.max.y * conversionFactor).toFixed(2),
            z:
                Number((bbox.max.z * conversionFactor).toFixed(2)) % 1 === 0
                    ? bbox.max.z * conversionFactor
                    : (bbox.max.z * conversionFactor).toFixed(2),
            a: Number(bbox.max.a.toFixed(2)),
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
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.delta.x}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.min.x}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.max.x}
                    </td>
                </tr>
                <tr>
                    <td className="border border-gray-300 px-1 py-0.5 font-bold">
                        Y
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.delta.y}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.min.y}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.max.y}
                    </td>
                </tr>
                <tr>
                    <td className="border border-gray-300 px-1 py-0.5 font-bold">
                        Z
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.delta.z}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.min.z}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center">
                        {formattedBBox.max.z}
                    </td>
                </tr>
                {fileContainsA && (
                    <tr>
                        <td className="border border-gray-300 px-1 py-0.5 font-bold">
                            A
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                            {formattedBBox.delta.a}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                            {formattedBBox.min.a}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                            {formattedBBox.max.a}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default Size;

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
            x: (bbox.delta.x * conversionFactor).toFixed(2),
            y: (bbox.delta.y * conversionFactor).toFixed(2),
            z: (bbox.delta.z * conversionFactor).toFixed(2),
            a: bbox.delta.a.toFixed(2),
        },
        min: {
            x: (bbox.min.x * conversionFactor).toFixed(2),
            y: (bbox.min.y * conversionFactor).toFixed(2),
            z: (bbox.min.z * conversionFactor).toFixed(2),
            a: bbox.min.a.toFixed(2),
        },
        max: {
            x: (bbox.max.x * conversionFactor).toFixed(2),
            y: (bbox.max.y * conversionFactor).toFixed(2),
            z: (bbox.max.z * conversionFactor).toFixed(2),
            a: bbox.max.a.toFixed(2),
        },
    };

    return (
        <table className="border-collapse border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-300">
            <thead>
                <tr>
                    <th className="border border-gray-300 px-1"></th>
                    <th className="border border-gray-300 px-1">Size</th>
                    <th className="border border-gray-300 px-1">Min</th>
                    <th className="border border-gray-300 px-1">Max</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="border border-gray-300 px-1 font-bold">
                        X
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.delta.x}
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.min.x}
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.max.x}
                    </td>
                </tr>
                <tr>
                    <td className="border border-gray-300 px-1 font-bold">
                        Y
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.delta.y}
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.min.y}
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.max.y}
                    </td>
                </tr>
                <tr>
                    <td className="border border-gray-300 px-1 font-bold">
                        Z
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.delta.z}
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.min.z}
                    </td>
                    <td className="border border-gray-300 px-1 text-center">
                        {formattedBBox.max.z}
                    </td>
                </tr>
                {fileContainsA && (
                    <tr>
                        <td className="border border-gray-300 px-1 font-bold">
                            A
                        </td>
                        <td className="border border-gray-300 px-1 text-center">
                            {formattedBBox.delta.a}
                        </td>
                        <td className="border border-gray-300 px-1 text-center">
                            {formattedBBox.min.a}
                        </td>
                        <td className="border border-gray-300 px-1 text-center">
                            {formattedBBox.max.a}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default Size;

import React, { useState } from 'react';

import store from 'app/store';

import Input from '../../containers/Preferences/components/Input';

const StockDiameter = () => {
    const [stockDiameter, setStockDiameter] = useState(0);
    const units = store.get('workspace.units');

    return (
        <div>
            <label>Stock Diameter</label>
            <Input
                units={units}
                onChange={(e) => setStockDiameter(e.target.value)}
                additionalProps={{ type: 'number' }}
                value={stockDiameter}
            />
        </div>
    );
};

export default StockDiameter;

import React from 'react';

const AddProbe = () => {
    return (
        <div>
            <div className="form-group">
                <label htmlFor="xyThickness">Touch Plate Identifier</label>
                <input type="text" className="form-control" id="id" />
                <span id="helpBlock" className="help-block">Text identifier for a specific touchplate profiles</span>
            </div>
            <div className="form-group">
                <label htmlFor="xyThickness">XY Thickness</label>
                <div className="input-group">
                    <input type="number" className="form-control" id="xyThickness" />
                    <div className="input-group-addon">mm</div>
                </div>
                <span id="helpBlock" className="help-block">Distance between the side of the touchplate and the material it is resting on.</span>
            </div>
            <div className="form-group">
                <label htmlFor="zThickness">Z Thickness</label>
                <div className="input-group">
                    <input type="number" className="form-control" id="zThickness" />
                    <div className="input-group-addon">mm</div>
                </div>
                <span id="helpBlock" className="help-block">Distance between the top of the touchplate and the material it is resting on. </span>
            </div>
        </div>
    );
};

export default AddProbe;

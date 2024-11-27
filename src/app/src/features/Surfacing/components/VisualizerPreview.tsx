type VisualizerPreviewProps = {
    gcode?: string;
};

const VisualizerPreview = ({ gcode }: VisualizerPreviewProps) => {
    if (!gcode) {
        return (
            <div className="text-sm text-muted-foreground">
                Click Generate G-code to see a preview
            </div>
        );
    }

    return <div>VisualizerPreview</div>;
};

export default VisualizerPreview;

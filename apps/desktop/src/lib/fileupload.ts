import api from 'app/api';

export const uploadGcodeFileToServer = async (
    file: File,
    port: string,
    visualizer: string,
) => {
    const formData = new FormData();
    formData.append('gcode', file);
    formData.append('port', port);
    formData.append('visualizer', visualizer);

    return api.file.upload(formData);
};

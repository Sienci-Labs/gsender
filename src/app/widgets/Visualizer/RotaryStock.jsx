import * as THREE from 'three';

class RotaryStock {
    obj = null;

    constructor(params = {}) {
        return this.createObject(params);
    }

    createObject = ({
        radiusTop = 5,
        radiusBottom = 5,
        height = 30,
        radialSegments = 15,
        heightSegments = 5,
        openEnded = false,
        name,
        visible = true,
    } = {}) => {
        const group = new THREE.Group();

        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
        geometry.translate(0, height / 2, 0);

        const material = new THREE.MeshStandardMaterial({ color: 'grey', wireframe: true });
        const cylinder = new THREE.Mesh(geometry, material);

        group.name = name;
        group.visible = visible;
        group.rotateZ(-Math.PI / 2);
        group.add(cylinder);

        this.obj = group;
    }

    updateSize = (height = 100) => {
        this.createObject({ height });
    }
}

export default RotaryStock;

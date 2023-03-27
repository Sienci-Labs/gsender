import * as THREE from 'three';

class RotaryStock extends THREE.Group {
    constructor(params = {}) {
        super();
        return this.createObject(params);
    }

    createObject = ({
        radiusTop = 2,
        radiusBottom = 2,
        height = 30,
        radialSegments = 15,
        heightSegments = 5,
        openEnded = false,
        name,
        visible = true,
    } = {}) => {
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
        geometry.translate(0, height / 2, 0);

        const material = new THREE.MeshStandardMaterial({ color: 'grey', wireframe: true });
        const cylinder = new THREE.Mesh(geometry, material);

        this.name = name;
        this.visible = visible;
        this.rotateZ(-Math.PI / 2);
        this.add(cylinder);
    }

    updateSize = (height = 100) => {
        this.createObject({ height });
    }
}

export default RotaryStock;

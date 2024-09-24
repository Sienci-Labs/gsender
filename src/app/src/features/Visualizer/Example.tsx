import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

const Example: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Create a sphere
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Position camera
        camera.position.z = 5;

        // Trackball controls
        const controls = new TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;

        // Animation loop
        const animate = () => {
            // requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        // const handleResize = () => {
        //     const width = window.innerWidth;
        //     const height = window.innerHeight;
        //     renderer.setSize(width, height);
        //     camera.aspect = width / height;
        //     camera.updateProjectionMatrix();
        // };
        // window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            // window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} />;
};

export default Example;

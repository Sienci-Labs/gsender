import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
    onScan: (text: string) => void;
}

// Camera viewfinder that decodes QR codes with jsQR. The pendant UI is served
// from 127.0.0.1, which counts as a secure context, so getUserMedia works in
// the Android WebView once MainActivity grants the camera permission.
export default function QrScanner({ onScan }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let frame = 0;
        let stopped = false;

        const tick = () => {
            if (stopped) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (
                video &&
                canvas &&
                video.readyState === video.HAVE_ENOUGH_DATA
            ) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d', {
                    willReadFrequently: true,
                });
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const image = ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );
                    const code = jsQR(image.data, image.width, image.height, {
                        inversionAttempts: 'dontInvert',
                    });
                    if (code?.data) {
                        stopped = true;
                        onScan(code.data);
                        return;
                    }
                }
            }
            frame = requestAnimationFrame(tick);
        };

        navigator.mediaDevices
            ?.getUserMedia({ video: { facingMode: 'environment' } })
            .then((s) => {
                if (stopped) {
                    s.getTracks().forEach((t) => t.stop());
                    return;
                }
                stream = s;
                const video = videoRef.current;
                if (!video) return;
                video.srcObject = s;
                video.play().catch(() => {});
                frame = requestAnimationFrame(tick);
            })
            .catch(() => {
                setError(
                    'Could not open the camera. Check that gSender has camera permission.',
                );
            });

        if (!navigator.mediaDevices) {
            setError('This device does not support camera access.');
        }

        return () => {
            stopped = true;
            cancelAnimationFrame(frame);
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [onScan]);

    if (error) {
        return <p className="text-sm text-red-600">{error}</p>;
    }

    return (
        <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
            />
            <div className="absolute inset-[15%] border-2 border-white/80 rounded-lg pointer-events-none" />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

const LoadingAnimation = () => {
    return (
        <div className="flex flex-col gap-2 justify-center items-center h-full">
            <div className="flex gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            </div>
        </div>
    );
};

export default LoadingAnimation;

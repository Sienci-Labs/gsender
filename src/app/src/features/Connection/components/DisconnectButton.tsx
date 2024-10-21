interface DisconnectButtonProps {
    disconnectHandler: () => void;
}

export function DisconnectButton({ disconnectHandler }: DisconnectButtonProps) {
    return (
        <button
            type="button"
            className="w-full flex h-full transition-opacity duration-200 rounded items-center font-normal justify-center absolute top-0 left-0 opacity-0 hover:opacity-100 bg-red-600 text-white z-20"
            onClick={disconnectHandler}
        >
            Disconnect
        </button>
    );
}

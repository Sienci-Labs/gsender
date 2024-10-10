export interface ModalProps {
    children?: React.ReactNode;
}

export function Modal(props: ModalProps) {
    return <div className="w-[1200px]">{props.children}</div>;
}

export default Modal;

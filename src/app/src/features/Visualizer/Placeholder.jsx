import PlaceholderImage from '../../../assets/placeholder.png';

export function VisualizerPlaceholder() {
    return (
        <div className="bg-transparent w-full h-full flex items-center justify-center ">
            <img src={PlaceholderImage} alt={"Louis the dog placeholder"} />
        </div>
    )
}

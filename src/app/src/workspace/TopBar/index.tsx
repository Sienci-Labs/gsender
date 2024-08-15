import gSenderIcon from './assets/icon-round.png';

export const TopBar = () => {
    return <div className="border p-3 h-20 box-border">
        <div className="w-[50px] h-[50px]">
            <img alt="gSender Logo" src={gSenderIcon}/>
        </div>

    </div>;
};

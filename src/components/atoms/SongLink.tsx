
interface SongLinkProps {
    label: string;
    songSrc: string;
    onPlay: (src: string) => void;
    isActive: boolean;
}

const SongLink: React.FC<SongLinkProps> = ({ label, songSrc, onPlay, isActive }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onPlay(songSrc);
    };
    const baseStyle = "text-base block mb-4 transition-colors duration-200  z-10";
    const activeStyle = "text-white font-extrabold underline";
    const inactiveStyle = "text-pink-200 hover:underline";


    return (
            <a href="#" 
            onClick={handleClick}
            className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}>
                {label}
            </a>
    );
};
export default SongLink;
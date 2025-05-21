
interface SongLinkProps {
    label: string;
    songSrc: string;
    onPlay: (src: string) => void;
}

const SongLink: React.FC<SongLinkProps> = ({ label, songSrc, onPlay }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onPlay(songSrc);
    };
    return (
            <a href="#" 
            onClick={handleClick}
            className="text-pink-300 text-base  hover:underline block mb-4 font-extralight">
                {label}
            </a>
    );
};
export default SongLink;
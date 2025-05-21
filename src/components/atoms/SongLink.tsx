
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
            className="text-pink-400 text-xl hover:underline block mb-4">
                {label}
            </a>
    );
};
export default SongLink;
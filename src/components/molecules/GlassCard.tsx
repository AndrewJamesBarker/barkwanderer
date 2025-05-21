
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", ...rest }) => { 
    return (
        <div className={`rounded-2xl bg-black/30 backdrop-blur-xl backdrop-saturate-150 bg-clip-padding border border-white/20 
            shadow-2xl transition-transform hover:scale-[1.01] p-8 ${className}`} {...rest}>
            {children}
        </div>
    )
}

export default GlassCard;
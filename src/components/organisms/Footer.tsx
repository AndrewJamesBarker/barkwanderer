import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="text-purple-400 text-right relative font-light">
      <p className="text-xs">
        &copy; {new Date().getFullYear()} BarkWanderer. All rights reserved.
      </p>
    </footer>
  );
};
export default Footer;

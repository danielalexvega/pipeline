import { FC } from "react";
import { Link } from "react-router-dom";

const Logo: FC = () => (
  <Link to="/?preview=true">
    <div className="flex gap-4 items-center">
      <img 
        src="/pipeline-logo3.png"
        alt="Pipeline Logo"
        width="200"
        height="200"
        className="object-contain"
      />
    </div>
  </Link>
);

export default Logo;
import { FC } from "react";
import { Link } from "react-router-dom";

const Logo: FC = () => (
  <Link to="/?preview=true">
    <div className="flex gap-4 items-center">
      <img 
        src="https://assets-au-01.kc-usercontent.com/ab00c5f7-85bf-02cf-55e1-a3d020897258/a6d2552f-7af1-44f3-8e63-38c38e08884f/am_logo_rgb.38aed1190173.png"
        alt="Australian Museum Logo"
        width="200"
        height="200"
        className="object-contain"
      />
    </div>
  </Link>
);

export default Logo;
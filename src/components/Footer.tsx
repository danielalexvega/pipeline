import { FC } from "react";
import Logo from "./Logo";
import Navigation from "./Navigation";
import Divider from "./Divider";

const Footer: FC = () => (
  <footer className="w-full">
    <div className="flex flex-col items-center gap-10 py-20">
      <Logo />
      <Navigation />
    </div>
    <Divider />
    <p className="text-sm text-white mx-auto w-fit py-[60px] uppercase font-lexend">This is a demo site built with Kontent.ai and Next.js.</p>
  </footer>
);

export default Footer;

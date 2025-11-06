import React from "react";
import { IconProps, IconWrapper } from "./IconWrapper";

type IconMoonProps = Omit<IconProps, "children">;

const IconMoon = React.forwardRef<SVGSVGElement, IconMoonProps>(
  ({ className, screenReaderText, size }, ref) => {
    return (
      <IconWrapper
        className={className}
        color="white"
        size={size}
        screenReaderText={screenReaderText}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ref={ref}
        >
          <path
            d="M21.752 15.002A9.718 9.718 0 0118 15.75C12.615 15.75 8.25 11.385 8.25 6C8.25 4.917 8.486 3.893 8.906 2.976C5.227 4.221 2.25 7.515 2.25 11.25C2.25 16.635 6.615 21 12 21C15.785 21 19.079 18.023 20.324 14.343C20.324 14.343 21.324 14.343 21.752 15.002Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconWrapper>
    );
  },
);

IconMoon.displayName = "IconMoon";
export default IconMoon;


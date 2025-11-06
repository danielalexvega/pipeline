import React from "react";
import { IconProps, IconWrapper } from "./IconWrapper";

type IconSunProps = Omit<IconProps, "children">;

const IconSun = React.forwardRef<SVGSVGElement, IconSunProps>(
  ({ className, color, screenReaderText, size }, ref) => {
    return (
      <IconWrapper
        className={className}
        color={color}
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
            d="M12 2.25V4.5M12 19.5V21.75M4.5 12H2.25M21.75 12H19.5M18.364 18.364L16.773 16.773M7.227 7.227L5.636 5.636M18.364 5.636L16.773 7.227M7.227 16.773L5.636 18.364M15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z"
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

IconSun.displayName = "IconSun";
export default IconSun;


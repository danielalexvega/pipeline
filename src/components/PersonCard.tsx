import { NavLink, useSearchParams } from "react-router-dom";
import { createPreviewLink } from "../utils/link";
import { useTheme } from "../context/ThemeContext";

const PersonCard: React.FC<{
  prefix?: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  jobTitle: string;
  codename: string;
  image: {
    url?: string;
    alt: string;
  };
}> = ({ prefix, firstName, lastName, suffix, jobTitle, codename, image }) => {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  const { isDarkMode } = useTheme();

  return (
    <div className="flex gap-4 items-center">
      <img src={image.url} alt={image.alt} className="w-[95px] h-[95px] object-cover rounded-full" />
      <div className="flex flex-col gap-2 items-start max-w-[325px]">
        <NavLink
          to={createPreviewLink(`/our-team/${codename}`, isPreview)}
          className={`text-heading-4 border-b-[2px] transition-all duration-300 ${isDarkMode ? "text-white border-black hover:border-white" : "text-darkGreen border-mintGreen hover:border-darkGreen"}`}
        >
          {prefix && <span>{prefix}</span>}
          {firstName} {lastName}
          {suffix && <span>, {suffix}</span>}
        </NavLink>
        <p className={`text-small ${isDarkMode ? "text-white" : "text-grey"}`}>
          {jobTitle}
        </p>
      </div>
    </div>
  );
};

export default PersonCard;

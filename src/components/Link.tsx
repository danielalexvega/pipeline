import { NavLink, useSearchParams } from "react-router";
import { createPreviewLink } from "../utils/link";

type LinkProps = Readonly<{
  href: string;
  text: string;
  className?: string;
}>;

const Link = ({ href, text, className = "" }: LinkProps) => {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  return (
    <NavLink
      to={createPreviewLink(href, isPreview)}
      className={`inline-block text-medium ${className}`}
    >
      {text}
    </NavLink>
  );
};

export default Link;

import { FC } from "react";
import { createElementSmartLink, createItemSmartLink } from "../utils/smartlink";
import { useTheme } from "../context/ThemeContext";
type TagProps = Readonly<{
  text: string;
  className?: string;
}>;

const Tag: FC<TagProps> = ({ text, className = "" }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      key={text}
      className={`w-fit px-4 py-2 border-solid border rounded-full border-tag-border-color ${isDarkMode ? "bg-black" : "bg-white"} ${className}`}
    >
      <p className="text-tag-text-color text-body-xs uppercase font-[600]">{text}</p>
    </div>
  );
};

type TagsProps = Readonly<{
  tags: ReadonlyArray<string>;
  orientation?: "horizontal" | "vertical";
  className?: string;
  itemId?: string;
  elementCodename?: string;
}>;

const Tags: FC<TagsProps> = ({ tags, orientation = "horizontal", className = "", itemId, elementCodename, }) => (
  <div
    className={`flex gap-2 justify-center lg:justify-normal ${
      orientation === "vertical" ? "flex-col" : ""
    } ${className}`}
    {...createItemSmartLink(itemId)}
    {...elementCodename && createElementSmartLink(elementCodename)}>
    {tags?.slice(0, 5).map(tag => <Tag key={tag} text={tag} />)}
  </div>
);

export default Tags;

import { FC } from "react";
import { isArticle, isEvent, LandingPage } from "../../model";
import FeaturedArticle from "./FeaturedArticle";
import FeaturedEvent from "./FeaturedEvent";
import CallToAction from "../CallToAction";
import { createElementSmartLink, createFixedAddSmartLink, createItemSmartLink } from "../../utils/smartlink";
import { useTheme } from "../../context/ThemeContext";

type FeaturedContentProps = {
  featuredContent: LandingPage["elements"]["featured_content"];
  parentId: string;
};

const FeaturedContent: FC<FeaturedContentProps> = ({ featuredContent, parentId }) => {
  const { isDarkMode } = useTheme();

  const linkedItems = featuredContent.linkedItems.map(
    (item) => {
      if (isArticle(item)) {
        return (
          <FeaturedArticle
            key={item.system.codename}
            article={{
              image: {
                url: item.elements.image.value[0]?.url ?? "",
                alt: item.elements.image.value[0]?.description ?? "",
              },
              title: item.elements.title?.value,
              publishDate: item.elements.publish_date?.value ?? "",
              introduction: item.elements.introduction?.value,
              topics: item.elements.music_topics?.value?.map(t => t.name) || [],
              itemId: item.system.id,
            }}
            displayFeatured={true}
            urlSlug={`articles/${item.elements.url_slug.value}`}
          />
        );
      }

      if (isEvent(item)) {
        return (
          <div key={item.system.codename} className="bg-creme rounded-lg p-6">
            <FeaturedEvent event={item} />
          </div>
        );
      }

      return (
        <div key={item.system.codename} className={isDarkMode ? "bg-black rounded-lg p-6" : "bg-mintGreen rounded-lg p-6"}>
          <CallToAction
            title={item.elements.headline?.value}
            description={item.elements.subheadline?.value}
            buttonText={item.elements.button_label?.value}
            buttonHref={item.elements.button_link?.value[0] ?? ""}
            imageSrc={item.elements.image.value[0]?.url}
            imageAlt={item.elements.image.value[0]?.description ?? "alt"}
            imagePosition={item.elements.image_position.value[0]?.codename ?? "left"}
            style={item.elements.style?.value[0]?.codename === "mint_green" ? "mintGreen" : "white"}
            componentId={item.system.id}
            componentName={item.system.name}
          />
        </div>
      );
    },
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-10"
    {...createItemSmartLink(parentId)}
    {...createElementSmartLink("featured_content")}
    {...createFixedAddSmartLink("end", "bottom")}
    >
      {linkedItems}
    </div>
  );
};

export default FeaturedContent;

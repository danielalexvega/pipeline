import { PortableTextReactResolvers } from "@kontent-ai/rich-text-resolver/utils/react";
import Link from "../components/Link";
import VideoComponent from "../components/Video";
import { Video } from "../model";
import { Elements, IContentItem } from "@kontent-ai/delivery-sdk";
import React from "react";

const baseResolvers: Omit<PortableTextReactResolvers, "types"> & { types: Omit<PortableTextReactResolvers["types"], "componentOrItem"> } = {
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => <ul className="text-xl text-gray-700 list-disc ml-8 py-5">{children}</ul>,
    number: ({ children }: { children?: React.ReactNode }) => <ol className="text-xl text-gray-700 list-decimal ml-8 py-5">{children}</ol>,
  },
  types: {
    image: ({ value }: { value: { asset: { url: string; alt: string } } }) => (
      <figure className="flex flex-col gap-4 items-center mb-10 relative w-full lg:w-[900px]">
        <img
          src={value.asset.url}
          alt={value.asset.alt}
          width={900}
          height={600}
          className="w-[900px] h-[600px] object-cover rounded-md"
        />
        <figcaption className="text-body-lg text-grey-light">
          {value.asset.alt}
        </figcaption>
      </figure>
    ),
  },
  marks: {
    link: ({ text, value }: { text?: React.ReactNode; value?: { href?: string } }) => <Link href={value?.href ?? "#"} text={typeof text === "string" ? text : String(text ?? "")}></Link>,
  },
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-heading-1 text-heading-1-color leading-[130%] w-full py-5">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-heading-2 text-heading-2-color leading-[130%] w-full py-5">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-heading-3 text-heading-3-color leading-[130%] w-full py-5">{children}</h3>,
    h4: ({ children }: { children?: React.ReactNode }) => <h4 className="text-heading-4 text-heading-4-color leading-[130%] w-full py-5">{children}</h4>,
    normal: ({ children }: { children?: React.ReactNode }) => <p className="text-body-lg text-body-color w-full pb-3 pt-3">{children}</p>,
  },
};

export const defaultPortableRichTextResolvers = (
  element?: Elements.RichTextElement
): PortableTextReactResolvers => ({
  ...baseResolvers,
  types: {
    ...baseResolvers.types,
    ...(element && {
      componentOrItem: ({ value }: { value: { componentOrItem: { _ref: string } } }) => {
        const item = element.linkedItems.find(item => item.system.codename === value.componentOrItem._ref) as IContentItem;
        if (!item) {
          return <div>Did not find any item with codename {value.componentOrItem._ref}</div>;
        }

        if (item.system.type === "video") {
          return <VideoComponent video={item as Video} componentId={item.system.id} componentName={item.system.name} />;
        }

        return (
          <div className="bg-red-500 text-white">
            Unsupported content type &quot;{item.system.type}&quot;
          </div>
        );
      },
    }),
  },
});

export const isEmptyRichText = (value: string) => value === "<p><br></p>";

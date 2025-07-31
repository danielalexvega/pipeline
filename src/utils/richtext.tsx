import { PortableTextReactResolvers } from "@kontent-ai/rich-text-resolver/utils/react";
import Link from "../components/Link";

export const defaultPortableRichTextResolvers = {
  list: {
    bullet: ({ children }) => <ul className="text-xl text-gray-700 list-disc ml-8 py-5">{children}</ul>,
    number: ({ children }) => <ol className="text-xl text-gray-700 list-decimal ml-8 py-5">{children}</ol>,
  },
  types: {
    image: ({ value }) => (
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
    link: ({ text, value }) => <Link href={value?.href ?? "#"} text={text}></Link>,
  },
  block: {
    h1: ({ children }) => <h1 className="text-heading-1 text-heading-1-color leading-[130%] w-full py-5">{children}</h1>,
    h2: ({ children }) => <h2 className="text-heading-2 text-heading-2-color leading-[130%] w-full py-5">{children}</h2>,
    h3: ({ children }) => <h3 className="text-heading-3 text-heading-3-color leading-[130%] w-full py-5">{children}</h3>,
    h4: ({ children }) => <h4 className="text-heading-4 text-heading-4-color leading-[130%] w-full py-5">{children}</h4>,

    normal: ({ children }) => <p className="text-body-lg text-body-color w-full pb-5">{children}</p>,
  },
} as const satisfies PortableTextReactResolvers;

export const isEmptyRichText = (value: string) => value === "<p><br></p>";

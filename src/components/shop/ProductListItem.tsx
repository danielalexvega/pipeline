import { FC, useMemo } from "react";
import ButtonLink from "../ButtonLink";
import { createItemSmartLink } from "../../utils/smartlink";
import { Product } from "../../model";

type ProductListItemProps = {
  product: Product;
};

export const ProductListItem: FC<ProductListItemProps> = ({
  product
}) => {
  type CloudinaryAsset = {
    url: string;
    alt?: string;
  };

  const parseCloudinaryAsset = (rawValue: string | undefined | null): CloudinaryAsset | null => {
    if (!rawValue) return null;

    const buildAsset = (value: unknown): CloudinaryAsset | null => {
      if (!value) return null;

      if (Array.isArray(value)) {
        for (const item of value) {
          const asset = buildAsset(item);
          if (asset) return asset;
        }
        return null;
      }

      if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        const secureUrl = typeof record.secure_url === "string" ? record.secure_url : undefined;
        const url = typeof record.url === "string" ? record.url : secureUrl;
        if (!url) return null;

        const alt =
          typeof record.alt === "string"
            ? record.alt
            : typeof record.altText === "string"
              ? record.altText
              : typeof record.description === "string"
                ? record.description
                : typeof record.public_id === "string"
                  ? record.public_id
                  : typeof (record.context as { custom?: { alt?: string } } | undefined)?.custom?.alt === "string"
                    ? (record.context as { custom?: { alt?: string } }).custom?.alt
                    : undefined;

        return { url, alt };
      }

      if (typeof value === "string" && value.trim().length > 0) {
        return { url: value.trim() };
      }

      return null;
    };

    try {
      const parsed = JSON.parse(rawValue);
      const asset = buildAsset(parsed);
      if (asset) return asset;
    } catch {
      // ignore parsing errors
    }

    return buildAsset(rawValue);
  };

  const cloudinaryAsset = useMemo(
    () => parseCloudinaryAsset(product.elements.cloudinary_integration?.value),
    [product.elements.cloudinary_integration?.value],
  );

  const productUrl = `/shop/${product.system.codename}`;

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
      {...createItemSmartLink(product.system.id)}>


      {/* Product Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {cloudinaryAsset ? (
          <img
            src={cloudinaryAsset.url}
            alt={cloudinaryAsset.alt || product.elements.name.value || "Product image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">No image</span>
            </div>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-burgundy transition-colors">
          {product.elements.name.value || "Untitled Product"}
        </h3>

        {/* Action Button */}
        <ButtonLink
          href={productUrl}
          style="mintGreen"
          className="w-full justify-center"
        >
          View Details
        </ButtonLink>
      </div>
    </div>
  );
};

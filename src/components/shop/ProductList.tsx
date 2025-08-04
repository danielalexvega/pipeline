import { FC } from "react";
import { ProductListItem } from "./ProductListItem";
import { Product } from "../../model";

interface ProductListProps {
  products: Product[];
}

const ProductList: FC<ProductListProps> = ({ 
  products, 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductListItem
          key={product.system.id}
          product={product}
        />
      ))}
    </div>
  );
};

export default ProductList;

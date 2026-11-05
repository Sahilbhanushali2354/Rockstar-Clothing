import ProductForm from "../ProductForm";

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProductForm editId={decodeURIComponent(params.id)} />;
}

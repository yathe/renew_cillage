import { PageHeader } from "../../_components/PageHeader";
import { ProductForm } from "../_components/ProductForm";

export default function NewProductPage(){
  return(
    <div className="flex justify-center items-center flex-col ">
    <PageHeader>Add Product</PageHeader>
    <ProductForm/>
    </div>
  )
}
import { SiteHeader } from "@/components/site-header";
import data from "../data.json";
import { ProductCards } from "@/components/product-cards";
import { ProductTable } from "@/components/product-table";

const page = () => {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ProductCards />
            <ProductTable data={data} />
          </div>
        </div>
      </div>
    </>
  );
};

export default page;

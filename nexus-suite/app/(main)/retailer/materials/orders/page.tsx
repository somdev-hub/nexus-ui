import { MaterialOrderTable } from "@/components/material-order-table";

import { Button } from "@/components/ui/button";
import data from "../../data.json";

const page = () => {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
          <div className="w-full">
            <div className="flex justify-between w-full">
              <h2 className="text-lg font-semibold mb-2">Orders</h2>
              <Button>Create new order</Button>
            </div>
            <MaterialOrderTable data={data} />
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
